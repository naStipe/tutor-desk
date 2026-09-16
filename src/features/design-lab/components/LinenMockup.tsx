import {
  ArrowUpIcon,
  BellIcon,
  BookIcon,
  CalendarIcon,
  GridIcon,
  InvoiceIcon,
  MoreIcon,
  PeopleIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon,
} from "./MockupIcons";
import styles from "./mockups.module.css";

const navItems = [
  { label: "Overview", icon: GridIcon, active: true },
  { label: "Calendar", icon: CalendarIcon },
  { label: "Students", icon: PeopleIcon },
  { label: "Lessons", icon: BookIcon },
  { label: "Invoices", icon: InvoiceIcon, badge: "3" },
];

const schedule = [
  { time: "09:30", name: "Maya Chen", subject: "A-level Physics", tone: "blue", initials: "MC" },
  {
    time: "13:00",
    name: "Noah Williams",
    subject: "GCSE Mathematics",
    tone: "lime",
    initials: "NW",
  },
  { time: "16:30", name: "Sofia Patel", subject: "Chemistry", tone: "violet", initials: "SP" },
];

function LinenLogo() {
  return (
    <div className={styles.linenLogo}>
      <span className={styles.linenLogoMark}>
        <span />
        <span />
      </span>
      <span>TutorDesk</span>
    </div>
  );
}

function RevenueChart() {
  return (
    <div className={styles.linenChartWrap}>
      <div className={styles.linenChartTop}>
        <div>
          <p className={styles.kicker}>Revenue</p>
          <div className={styles.metricRow}>
            <strong>€4,860</strong>
            <span className={styles.positivePill}>↗ 12.4%</span>
          </div>
        </div>
        <div className={styles.periodTabs}>
          <span>1M</span>
          <span className={styles.periodActive}>6M</span>
          <span>1Y</span>
        </div>
      </div>
      <svg
        className={styles.linenChart}
        viewBox="0 0 720 240"
        role="img"
        aria-label="Revenue rising from April to September"
      >
        <defs>
          <linearGradient id="linenArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7185aa" stopOpacity="0.15" />
            <stop offset="1" stopColor="#7185aa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className={styles.linenGridLines}>
          <path d="M40 30H700M40 90H700M40 150H700M40 210H700" />
        </g>
        <path
          className={styles.linenArea}
          d="M40 186C75 180 85 156 120 160S175 176 210 150 270 110 310 123s60 39 100 17 56-71 105-61 61 43 105 18 52-40 80-50V210H40Z"
        />
        <path
          className={styles.linenLine}
          pathLength="1"
          d="M40 186C75 180 85 156 120 160S175 176 210 150 270 110 310 123s60 39 100 17 56-71 105-61 61 43 105 18 52-40 80-50"
        />
        <g className={styles.linenPoint}>
          <circle cx="700" cy="47" r="8" />
          <circle cx="700" cy="47" r="3" />
        </g>
      </svg>
      <div className={styles.chartMonths}>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
        <span>Jul</span>
        <span>Aug</span>
        <span>Sep</span>
      </div>
    </div>
  );
}

export function LinenMockup() {
  return (
    <div className={styles.linenPage}>
      <aside className={styles.linenSidebar}>
        <LinenLogo />
        <div className={styles.linenWorkspace}>
          <span className={styles.avatarPeach}>AP</span>
          <span>
            <strong>Alex&apos;s Studio</strong>
            <small>Independent tutor</small>
          </span>
          <span className={styles.chevron}>⌄</span>
        </div>
        <nav className={styles.linenNavigation} aria-label="Mockup navigation">
          <p>Workspace</p>
          {navItems.map((item) => (
            <span key={item.label} className={item.active ? styles.linenNavActive : undefined}>
              <item.icon />
              {item.label}
              {item.badge && <b>{item.badge}</b>}
            </span>
          ))}
          <p className={styles.linenManageLabel}>Manage</p>
          <span>
            <SettingsIcon /> Settings
          </span>
        </nav>
        <div className={styles.linenSidebarBottom}>
          <div className={styles.linenMiniCard}>
            <span className={styles.miniSpark}>
              <SparkIcon />
            </span>
            <p>
              <strong>8 hours saved</strong>
              <small>this month with TutorDesk</small>
            </p>
          </div>
          <div className={styles.linenProfile}>
            <span className={styles.avatarInk}>AH</span>
            <p>
              <strong>Alex Hart</strong>
              <small>alex@tutordesk.co</small>
            </p>
            <MoreIcon />
          </div>
        </div>
      </aside>

      <main className={styles.linenMain}>
        <header className={styles.linenTopbar}>
          <div className={styles.searchBox}>
            <SearchIcon />
            <span>Search students, lessons…</span>
            <kbd>⌘ K</kbd>
          </div>
          <div className={styles.linenTopActions}>
            <span className={styles.iconButton}>
              <BellIcon />
              <i />
            </span>
            <span className={styles.linenDate}>Wednesday, 16 September</span>
            <span className={styles.primaryButton}>+ Add lesson</span>
          </div>
        </header>

        <div className={styles.linenContent}>
          <section className={styles.linenHeading}>
            <div>
              <p className={styles.kicker}>Good morning, Alex</p>
              <h1>Your studio is moving nicely.</h1>
            </div>
            <div className={styles.healthBadge}>
              <span />
              <p>
                <small>Studio health</small>
                <strong>Excellent</strong>
              </p>
              <ArrowUpIcon />
            </div>
          </section>

          <section className={styles.linenStats}>
            <article>
              <span className={styles.statIconBlue}>↗</span>
              <p>Monthly revenue</p>
              <strong>€4,860</strong>
              <small>
                <b>+12.4%</b> vs last month
              </small>
            </article>
            <article>
              <span className={styles.statIconLime}>◎</span>
              <p>Teaching hours</p>
              <strong>42.5h</strong>
              <small>
                <b>+6.2%</b> vs last month
              </small>
            </article>
            <article>
              <span className={styles.statIconViolet}>◌</span>
              <p>Active students</p>
              <strong>18</strong>
              <small>2 new this month</small>
            </article>
            <article>
              <span className={styles.statIconCoral}>!</span>
              <p>Needs attention</p>
              <strong>3</strong>
              <small>2 invoices · 1 homework</small>
            </article>
          </section>

          <section className={styles.linenDashboardGrid}>
            <article className={styles.linenRevenueCard}>
              <RevenueChart />
            </article>

            <article className={styles.linenNextCard}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.kicker}>Up next</p>
                  <h2>Today&apos;s focus</h2>
                </div>
                <MoreIcon />
              </div>
              <div className={styles.nextTime}>
                <span>09:30</span>
                <small>in 24 min</small>
              </div>
              <div className={styles.nextStudent}>
                <span className={styles.avatarBlue}>MC</span>
                <p>
                  <strong>Maya Chen</strong>
                  <small>A-level Physics · 60 min</small>
                </p>
              </div>
              <div className={styles.prepProgress}>
                <div>
                  <span>Lesson preparation</span>
                  <b>80%</b>
                </div>
                <i>
                  <span />
                </i>
              </div>
              <span className={styles.darkButton}>
                Open lesson room <b>↗</b>
              </span>
            </article>

            <article className={styles.linenScheduleCard}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.kicker}>Wednesday</p>
                  <h2>Today&apos;s schedule</h2>
                </div>
                <span className={styles.textLink}>View calendar →</span>
              </div>
              <div className={styles.scheduleList}>
                {schedule.map((item, index) => (
                  <div key={item.time} className={styles.scheduleRow}>
                    <time>{item.time}</time>
                    <span
                      className={`${styles.scheduleLine} ${styles[`scheduleLine${item.tone}`]}`}
                    />
                    <span
                      className={`${styles.scheduleAvatar} ${styles[`scheduleAvatar${item.tone}`]}`}
                    >
                      {item.initials}
                    </span>
                    <p>
                      <strong>{item.name}</strong>
                      <small>{item.subject}</small>
                    </p>
                    <span className={index === 0 ? styles.statusReady : styles.statusPlanned}>
                      {index === 0 ? "Ready" : "Planned"}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.linenWorkloadCard}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.kicker}>Workload</p>
                  <h2>Teaching rhythm</h2>
                </div>
                <span className={styles.weekChip}>This week⌄</span>
              </div>
              <div className={styles.workloadChart}>
                {[
                  ["mon", "M", 58],
                  ["tue", "T", 82],
                  ["wed", "W", 46],
                  ["thu", "T", 94],
                  ["fri", "F", 68],
                  ["sat", "S", 24],
                  ["sun", "S", 12],
                ].map(([id, day, height], index) => (
                  <div key={id}>
                    <span
                      style={{ height: `${height}%` }}
                      className={index === 3 ? styles.barActive : undefined}
                    />
                    <small>{day}</small>
                  </div>
                ))}
              </div>
              <div className={styles.workloadFooter}>
                <span>
                  <b>12</b> lessons
                </span>
                <span>
                  <b>10.5h</b> total
                </span>
                <span>
                  <b>Thu</b> busiest
                </span>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
