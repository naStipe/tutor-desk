export type LayoutInterval = { id: string; startMinutes: number; endMinutes: number };

export type LessonLayout = { id: string; column: number; columns: number };

/**
 * Assigns each interval a column and a column count so that overlapping intervals render
 * side-by-side instead of stacked on top of each other. Intervals are grouped into clusters of
 * mutually-overlapping events (connected transitively through shared time, not just pairwise),
 * and every interval in a cluster shares that cluster's column count.
 */
export function layoutDayIntervals(intervals: LayoutInterval[]): Map<string, LessonLayout> {
  const sorted = [...intervals].sort(
    (a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes,
  );

  const result = new Map<string, LessonLayout>();
  let cluster: LayoutInterval[] = [];
  let clusterEnd = -Infinity;

  function flushCluster() {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    const columnOf = new Map<string, number>();
    for (const interval of cluster) {
      let column = columnEnds.findIndex((end) => end <= interval.startMinutes);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(interval.endMinutes);
      } else {
        columnEnds[column] = interval.endMinutes;
      }
      columnOf.set(interval.id, column);
    }
    const columns = columnEnds.length;
    for (const interval of cluster) {
      result.set(interval.id, { id: interval.id, column: columnOf.get(interval.id) ?? 0, columns });
    }
    cluster = [];
    clusterEnd = -Infinity;
  }

  for (const interval of sorted) {
    if (cluster.length > 0 && interval.startMinutes >= clusterEnd) {
      flushCluster();
    }
    cluster.push(interval);
    clusterEnd = Math.max(clusterEnd, interval.endMinutes);
  }
  flushCluster();

  return result;
}
