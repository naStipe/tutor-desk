import {
  BellIcon,
  BookIcon,
  CalendarIcon,
  GridIcon,
  InvoiceIcon,
  PeopleIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon,
} from "./MockupIcons";
import styles from "./mockups.module.css";

const orbitNav = [
  { id: "overview", Icon: GridIcon },
  { id: "calendar", Icon: CalendarIcon },
  { id: "students", Icon: PeopleIcon },
  { id: "lessons", Icon: BookIcon },
  { id: "invoices", Icon: InvoiceIcon },
];

function OrbitLineChart() {
  return (
    <svg
      className={styles.orbitLineChart}
      viewBox="0 0 600 200"
      role="img"
      aria-label="Weekly income trend rising to 1,240 euros"
    >
      <defs>
        <linearGradient id="orbitArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fc8b7" stopOpacity="0.18" />
          <stop offset="1" stopColor="#9fc8b7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className={styles.orbitGrid}>
        <path d="M24 24H576M24 78H576M24 132H576M24 186H576" />
      </g>
      <path
        className={styles.orbitArea}
        d="M24 166C54 156 76 144 104 149s43 24 74 10 39-62 79-55 53 29 89 12 39-47 77-37 50 25 76 6 42-36 77-50V186H24Z"
      />
      <path
        className={styles.orbitLine}
        d="M24 166C54 156 76 144 104 149s43 24 74 10 39-62 79-55 53 29 89 12 39-47 77-37 50 25 76 6 42-36 77-50"
      />
      <circle className={styles.orbitChartPoint} cx="576" cy="35" r="5" />
    </svg>
  );
}

function OrbitDonut() {
  return (
    <div className={styles.orbitDonut}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="49" pathLength="100" className={styles.donutTrack} />
        <circle cx="60" cy="60" r="49" pathLength="100" className={styles.donutLime} />
        <circle cx="60" cy="60" r="49" pathLength="100" className={styles.donutViolet} />
        <circle cx="60" cy="60" r="49" pathLength="100" className={styles.donutOrange} />
      </svg>
      <span>
        <strong>86%</strong>
        <small>complete</small>
      </span>
    </div>
  );
}

export function OrbitMockup() {
  return (
    <div className={styles.orbitPage}>
      <aside className={styles.orbitRail}>
        <span className={styles.orbitLogo}>
          <i />
          <i />
          <i />
        </span>
        <nav aria-label="Mockup navigation">
          {orbitNav.map(({ id, Icon }, index) => (
            <span key={id} className={index === 0 ? styles.orbitNavActive : undefined}>
              <Icon />
              {index === 4 && <i className={styles.orbitNotice}>3</i>}
            </span>
          ))}
        </nav>
        <div className={styles.orbitRailBottom}>
          <span>
            <SettingsIcon />
          </span>
          <span className={styles.orbitAvatar}>AH</span>
        </div>
      </aside>

      <div className={styles.orbitShell}>
        <header className={styles.orbitTopbar}>
          <div className={styles.orbitBrand}>
            <strong>
              TUTOR<span>/</span>DESK
            </strong>
            <small>TEACHING OS</small>
          </div>
          <div className={styles.orbitSearch}>
            <SearchIcon />
            <span>Find anything</span>
            <kbd>⌘K</kbd>
          </div>
          <div className={styles.orbitTopActions}>
            <span className={styles.orbitSync}>
              <i /> Up to date
            </span>
            <span className={styles.orbitBell}>
              <BellIcon />
              <i />
            </span>
            <span className={styles.orbitAdd}>＋ Add lesson</span>
          </div>
        </header>

        <main className={styles.orbitMain}>
          <section className={styles.orbitHeading}>
            <div>
              <span className={styles.orbitEyebrow}>Wed · 16 Sep · Week 38</span>
              <h1>
                Good morning, Alex<span>.</span>
              </h1>
              <p>
                Four lessons. One review. Your day is <b>86% prepared.</b>
              </p>
            </div>
            <div className={styles.orbitPulse}>
              <span>
                <i /> Studio time
              </span>
              <strong>09:06</strong>
              <small>Europe / Helsinki</small>
            </div>
          </section>

          <section className={styles.orbitGridLayout}>
            <article className={styles.orbitHeroCard}>
              <div className={styles.orbitCardLabel}>
                <span>Next · 09:30</span>
                <span className={styles.orbitLivePill}>
                  <i /> In 24 min
                </span>
              </div>
              <div className={styles.orbitHeroBody}>
                <div>
                  <span className={styles.orbitStudentAvatar}>MC</span>
                  <h2>Maya Chen</h2>
                  <p>
                    A-level Physics <span>·</span> Electromagnetic induction
                  </p>
                </div>
                <div className={styles.orbitPrepScore}>
                  <OrbitDonut />
                </div>
              </div>
              <div className={styles.orbitHeroFooter}>
                <div>
                  <span>01</span>
                  <p>
                    <small>Duration</small>
                    <b>60 MIN</b>
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <p>
                    <small>Format</small>
                    <b>ONLINE</b>
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <p>
                    <small>Materials</small>
                    <b>4 FILES</b>
                  </p>
                </div>
                <span className={styles.orbitLaunch}>Open lesson room ↗</span>
              </div>
            </article>

            <article className={styles.orbitAgendaCard}>
              <div className={styles.orbitCardLabel}>
                <span>Day · Agenda</span>
                <span>4 lessons</span>
              </div>
              <div className={styles.orbitTimeline}>
                {[
                  ["09:30", "Maya Chen", "Physics", "lime"],
                  ["13:00", "Noah Williams", "Mathematics", "violet"],
                  ["16:30", "Sofia Patel", "Chemistry", "orange"],
                  ["18:00", "Leo Martin", "Mathematics", "blue"],
                ].map(([time, name, subject, tone], index) => (
                  <div key={time} className={styles.orbitTimelineRow}>
                    <time>{time}</time>
                    <span className={`${styles.orbitTimelineDot} ${styles[`orbitDot${tone}`]}`} />
                    <p>
                      <strong>{name}</strong>
                      <small>{subject}</small>
                    </p>
                    <span className={index === 0 ? styles.orbitReady : styles.orbitQueued}>
                      {index === 0 ? "READY" : index === 2 ? "PLAN 60%" : "PLANNED"}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.orbitIncomeCard}>
              <div className={styles.orbitCardLabel}>
                <span>Income · 7 days</span>
                <span className={styles.orbitDelta}>↑ 18.2%</span>
              </div>
              <div className={styles.orbitIncomeMetric}>
                <strong>€1,240</strong>
                <span>
                  €1,480 <small>projected</small>
                </span>
              </div>
              <OrbitLineChart />
              <div className={styles.orbitChartLabels}>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
                <span>SUN</span>
              </div>
            </article>

            <article className={styles.orbitSignalCard}>
              <div className={styles.orbitCardLabel}>
                <span>Studio · Signals</span>
                <SparkIcon />
              </div>
              <div className={styles.orbitSignals}>
                <div>
                  <span className={styles.signalViolet}>03</span>
                  <p>
                    <strong>Homework reviews</strong>
                    <small>2 submitted today</small>
                  </p>
                  <b>→</b>
                </div>
                <div>
                  <span className={styles.signalOrange}>02</span>
                  <p>
                    <strong>Unpaid invoices</strong>
                    <small>€280 outstanding</small>
                  </p>
                  <b>→</b>
                </div>
                <div>
                  <span className={styles.signalBlue}>94</span>
                  <p>
                    <strong>Student momentum</strong>
                    <small>Up 7 points this month</small>
                  </p>
                  <b>↗</b>
                </div>
              </div>
            </article>

            <article className={styles.orbitWeekCard}>
              <div className={styles.orbitCardLabel}>
                <span>Capacity · Week 38</span>
                <span>21.5 / 30H</span>
              </div>
              <div className={styles.orbitWeekHeader}>
                <div>
                  <strong>72%</strong>
                  <small>BOOKED</small>
                </div>
                <p>
                  <span>
                    <i className={styles.legendLime} /> Lessons
                  </span>
                  <span>
                    <i className={styles.legendViolet} /> Prep
                  </span>
                </p>
              </div>
              <div className={styles.orbitBars}>
                {[
                  ["mon", "M", 72, 18],
                  ["tue", "T", 88, 10],
                  ["wed", "W", 58, 27],
                  ["thu", "T", 96, 14],
                  ["fri", "F", 76, 20],
                  ["sat", "S", 30, 8],
                  ["sun", "S", 16, 5],
                ].map(([id, day, lesson, prep]) => (
                  <div key={id}>
                    <span>
                      <i style={{ height: `${lesson}%` }} />
                      <b style={{ height: `${prep}%` }} />
                    </span>
                    <small>{day}</small>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
