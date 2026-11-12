"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Decision = {
  date: string;
  agent: string;
  name: string;
  title: string;
};

type CheckStatus = {
  status: "green" | "red";
  finishedAt: string;
  durationMs: number;
} | null;

type Period = "24 часа" | "7 дней" | "30 дней";

const periodOptions: Period[] = ["24 часа", "7 дней", "30 дней"];

type DemoMetric = {
  value: string;
  delta: string;
  hint: string;
};

type Experiment = {
  id: string;
  format: string;
  hook: string;
  channel: "Instagram" | "TikTok" | "YouTube Shorts";
  state: "Тест" | "Сигнал" | "Черновик";
  views: number;
  hold: number;
  clicks: number;
  ctr: number;
  confidence: string;
  color: string;
  next: string;
};

const initialExperiments: Experiment[] = [
  {
    id: "R-014",
    format: "До / после",
    hook: "Собрал продукт за один вечер",
    channel: "Instagram",
    state: "Сигнал",
    views: 18400,
    hold: 78,
    clicks: 126,
    ctr: 6.8,
    confidence: "средняя",
    color: "#c85a35",
    next: "Повторить хук на другой категории продукта и сравнить переходы на сайт.",
  },
  {
    id: "R-013",
    format: "Разбор экрана",
    hook: "Вот что vibecoding меняет в работе",
    channel: "Instagram",
    state: "Тест",
    views: 12620,
    hold: 64,
    clicks: 74,
    ctr: 5.9,
    confidence: "низкая",
    color: "#536e9c",
    next: "Дать ролику набрать выборку. Следующий срез — после 20 тысяч просмотров.",
  },
  {
    id: "R-012",
    format: "Миф / факт",
    hook: "Для этого больше не нужна команда из 5 человек",
    channel: "YouTube Shorts",
    state: "Тест",
    views: 9800,
    hold: 71,
    clicks: 48,
    ctr: 4.9,
    confidence: "низкая",
    color: "#a35e8a",
    next: "Проверить более конкретный первый кадр, оставив остальной сценарий без изменений.",
  },
  {
    id: "R-011",
    format: "Список за 20 секунд",
    hook: "3 задачи, которые я больше не делаю вручную",
    channel: "TikTok",
    state: "Черновик",
    views: 0,
    hold: 0,
    clicks: 0,
    ctr: 0,
    confidence: "нет данных",
    color: "#43836c",
    next: "Сценарий собран. Перед публикацией проверить ссылку и субтитры.",
  },
  {
    id: "R-010",
    format: "Реакция на тренд",
    hook: "Когда говоришь идею вслух — и она уже работает",
    channel: "Instagram",
    state: "Сигнал",
    views: 24700,
    hold: 53,
    clicks: 69,
    ctr: 2.8,
    confidence: "средняя",
    color: "#bd8744",
    next: "Удержание ниже медианы. Укоротить вступление и вынести результат в первый кадр.",
  },
];

const queue = [
  {
    time: "10:30",
    channel: "Instagram",
    title: "Собрал продукт за один вечер",
    kind: "До / после",
    state: "На проверке",
  },
  {
    time: "13:00",
    channel: "TikTok",
    title: "3 задачи, которые я больше не делаю вручную",
    kind: "Список",
    state: "Черновик",
  },
  {
    time: "16:15",
    channel: "YouTube Shorts",
    title: "Почему прототип больше не начинается с Figma",
    kind: "Разбор",
    state: "Идея",
  },
];

const signals = [
  {
    tone: "amber",
    label: "Проверить",
    text: "У R-014 высокий CTR (6,8 на 1K), но данных пока недостаточно для вывода.",
  },
  {
    tone: "red",
    label: "Слабое удержание",
    text: "R-010 теряет зрителей в первые 3 секунды. Проверьте вступление.",
  },
  {
    tone: "blue",
    label: "Следующий тест",
    text: "Повторить формат «До / после» с другим первым кадром.",
  },
];

const periodMetrics: Record<
  Period,
  [DemoMetric, DemoMetric, DemoMetric, DemoMetric]
> = {
  "24 часа": [
    { value: "17,2", delta: "↑ 0,4", hint: "главный сигнал качества" },
    { value: "8 930", delta: "↑ 3,1%", hint: "сумма по демо-роликам" },
    { value: "69%", delta: "↑ 0,8 п.п.", hint: "досмотрели первые секунды" },
    { value: "183", delta: "↑ 5,2%", hint: "демо-атрибуция переходов" },
  ],
  "7 дней": [
    { value: "18,4", delta: "↑ 2,1", hint: "главный сигнал качества" },
    { value: "67 420", delta: "↑ 8,6%", hint: "сумма по демо-роликам" },
    { value: "68%", delta: "↓ 1,4 п.п.", hint: "досмотрели первые секунды" },
    { value: "1 241", delta: "↑ 12,8%", hint: "демо-атрибуция переходов" },
  ],
  "30 дней": [
    { value: "16,9", delta: "↑ 1,3", hint: "главный сигнал качества" },
    { value: "241 880", delta: "↑ 18,2%", hint: "сумма по демо-роликам" },
    { value: "65%", delta: "↓ 2,2 п.п.", hint: "досмотрели первые секунды" },
    { value: "4 078", delta: "↑ 21,4%", hint: "демо-атрибуция переходов" },
  ],
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function CheckPill({ status }: { status: CheckStatus }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-2 text-[11px] text-[#6d7778]">
        <i className="h-1.5 w-1.5 rounded-full bg-[#a1a8a7]" />
        Проверка не запускалась
      </span>
    );
  }

  const when = new Date(status.finishedAt).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-[#53615f]">
      <i
        className={`h-1.5 w-1.5 rounded-full ${status.status === "green" ? "bg-[#25845e]" : "bg-[#c34337]"}`}
      />
      Check {status.status === "green" ? "зелёный" : "красный"}
      <span className="text-[#929a98]">
        {when} · {(status.durationMs / 1000).toFixed(1)} с
      </span>
    </span>
  );
}

function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta: string;
  hint: string;
}) {
  return (
    <article className="min-w-0 border-l border-[#d7dbd7] pl-4 first:border-0 first:pl-0">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64716f]">
        {label}
        <span className="rounded-sm bg-[#f1e8d5] px-1.5 py-0.5 text-[9px] tracking-[0.08em] text-[#866528]">
          ДЕМО
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <strong className="font-mono text-[26px] font-medium leading-none tracking-[-0.06em] text-[#192523]">
          {value}
        </strong>
        <span
          className={`font-mono text-[10px] ${delta.startsWith("↓") ? "text-[#b75042]" : "text-[#43816a]"}`}
        >
          {delta}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-[#7b8582]">{hint}</p>
    </article>
  );
}

function ChannelStatus({
  name,
  mark,
  description,
  color,
}: {
  name: string;
  mark: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-r border-[#dfe2de] px-4 first:pl-0 last:border-0 last:pr-0">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {mark}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold text-[#263331]">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-[#7a8582]">
          {description}
        </span>
      </span>
      <i className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#b3b9b5]" />
    </div>
  );
}

export function AdminDashboard({
  projectTitle,
  checkStatus,
  decisions,
  readmeHtml,
  journalHtml,
}: {
  projectTitle: string;
  checkStatus: CheckStatus;
  decisions: Decision[];
  readmeHtml: string;
  journalHtml: string;
}) {
  const [experiments, setExperiments] = useState(initialExperiments);
  const [selectedId, setSelectedId] = useState(initialExperiments[0].id);
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("Все каналы");
  const [period, setPeriod] = useState<Period>("7 дней");
  const [sortDescending, setSortDescending] = useState(true);
  const [showOnlyAttention, setShowOnlyAttention] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") setCommandOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const visibleExperiments = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru");
    return experiments
      .filter(
        (experiment) =>
          channel === "Все каналы" || experiment.channel === channel,
      )
      .filter(
        (experiment) =>
          !normalized ||
          `${experiment.id} ${experiment.hook} ${experiment.format} ${experiment.channel}`
            .toLocaleLowerCase("ru")
            .includes(normalized),
      )
      .sort((a, b) => (sortDescending ? b.ctr - a.ctr : a.ctr - b.ctr));
  }, [channel, experiments, query, sortDescending]);

  const selected =
    experiments.find((experiment) => experiment.id === selectedId) ??
    experiments[0];
  const visibleQueue = showOnlyAttention
    ? queue.filter((item) => item.state !== "На проверке")
    : queue;
  const [siteCtr, views, retention, siteClicks] = periodMetrics[period];

  function addDemoDraft() {
    const nextNumber = 15 + experiments.length - initialExperiments.length;
    const draft: Experiment = {
      id: `R-${String(nextNumber).padStart(3, "0")}`,
      format: "Новый формат",
      hook: "Новый тест · добавить гипотезу",
      channel: "Instagram",
      state: "Черновик",
      views: 0,
      hold: 0,
      clicks: 0,
      ctr: 0,
      confidence: "нет данных",
      color: "#73806e",
      next: "Это локальный демонстрационный черновик. Подключите рабочий источник данных, чтобы создать реальный тест.",
    };
    setExperiments((current) => [draft, ...current]);
    setSelectedId(draft.id);
  }

  return (
    <main className="min-h-screen bg-[#f2f3f0] text-[#1d2927]">
      <div className="mx-auto min-h-screen max-w-[1600px] border-x border-[#e0e3df] bg-[#f8f9f6] shadow-[0_0_70px_rgba(28,40,36,0.035)]">
        <header className="sticky top-0 z-20 border-b border-[#d9ded9] bg-[#fbfcf9]/95 backdrop-blur">
          <div className="flex min-h-[58px] items-center gap-5 px-4 sm:px-6 lg:px-8">
            <Link
              aria-label="Videozavod — главная"
              className="flex shrink-0 items-center gap-2.5"
              href="/"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#1e302b] font-mono text-[13px] font-bold tracking-[-0.12em] text-[#e7d9af]">
                VZ
              </span>
              <span className="hidden sm:block">
                <span className="block text-[11px] font-bold tracking-[0.14em] text-[#23332e]">
                  VIDEOZAVOD
                </span>
                <span className="block text-[9px] uppercase tracking-[0.14em] text-[#87908b]">
                  контентная фабрика
                </span>
              </span>
            </Link>
            <span className="hidden h-7 w-px bg-[#dde1dc] md:block" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-[#394743]">
                {projectTitle}
                <span className="px-2 text-[#aeb5b0]">/</span>Рабочий стол
              </div>
              <CheckPill status={checkStatus} />
            </div>
            <div className="hidden items-center gap-2 rounded-md border border-[#e3d7bc] bg-[#f7f0df] px-2.5 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bb8b36]" />
              <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#80632d]">
                ДЕМО ДАННЫЕ
              </span>
            </div>
            <a
              className="rounded-md border border-[#dce1dc] px-3 py-2 text-[11px] font-medium text-[#5d6965] transition hover:bg-white"
              href="/logout"
            >
              Выйти
            </a>
          </div>
        </header>

        <div className="border-b border-[#e0e4df] bg-[#f5f6f3] px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Разделы админки"
            className="flex h-10 items-stretch gap-6 overflow-x-auto text-[11px]"
          >
            <a
              className="relative flex shrink-0 items-center font-semibold text-[#24342f] after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-[#bb8b36]"
              href="#overview"
            >
              Обзор
            </a>
            <a
              className="flex shrink-0 items-center text-[#75807c] transition hover:text-[#263632]"
              href="#experiments"
            >
              Эксперименты{" "}
              <span className="ml-1.5 rounded bg-[#e8ebe6] px-1.5 py-0.5 font-mono text-[9px]">
                05
              </span>
            </a>
            <a
              className="flex shrink-0 items-center text-[#75807c] transition hover:text-[#263632]"
              href="#queue"
            >
              Очередь{" "}
              <span className="ml-1.5 rounded bg-[#e8ebe6] px-1.5 py-0.5 font-mono text-[9px]">
                03
              </span>
            </a>
            <a
              className="flex shrink-0 items-center text-[#75807c] transition hover:text-[#263632]"
              href="#documents"
            >
              Спека и журнал
            </a>
          </nav>
        </div>

        <div
          id="overview"
          className="space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7"
        >
          <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#82908a]">
                <span>VZ / OPS</span>
                <span className="text-[#c5cbc5]">·</span>
                <span>01</span>
                <span className="text-[#c5cbc5]">·</span>
                <span>Пульт производства</span>
              </div>
              <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.055em] text-[#1c2a26] sm:text-[32px]">
                Контентный поток
              </h1>
              <p className="mt-1.5 text-[12px] text-[#737f7a]">
                От гипотезы ролика до перехода на vibecoding.tech.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex rounded-md border border-[#dce1dc] bg-white p-0.5"
                role="group"
                aria-label="Период демонстрационных данных"
              >
                {periodOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setPeriod(item)}
                    aria-pressed={period === item}
                    className={`rounded px-2.5 py-1.5 text-[10px] transition ${period === item ? "bg-[#e9ede8] font-semibold text-[#2d3d37]" : "text-[#75807b] hover:text-[#283933]"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                onClick={addDemoDraft}
                className="rounded-md bg-[#243b33] px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#304b40]"
              >
                ＋ Демо-тест
              </button>
            </div>
          </section>

          <section
            aria-label="Состояние каналов"
            className="grid grid-cols-1 divide-y divide-[#dfe2de] rounded-lg border border-[#dfe2de] bg-white px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-5"
          >
            <ChannelStatus
              name="Instagram Reels"
              mark="IG"
              description="Аккаунт не подключён"
              color="#9b536f"
            />
            <ChannelStatus
              name="TikTok"
              mark="TT"
              description="Аккаунт не подключён"
              color="#202b2b"
            />
            <ChannelStatus
              name="YouTube Shorts"
              mark="YT"
              description="Канал не подключён"
              color="#b94d42"
            />
          </section>

          <section
            aria-label="Сводка демонстрационных метрик"
            className="rounded-lg border border-[#dfe2de] bg-white px-4 py-4 sm:px-5"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#53625c]">
                Сигналы контентной воронки
              </div>
              <span className="font-mono text-[9px] text-[#929b96]">
                {period.toUpperCase()} · ЛОКАЛЬНЫЙ МАКЕТ
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:gap-y-0">
              <StatCard
                label="Переходы / 1K просмотров"
                value={siteCtr.value}
                delta={siteCtr.delta}
                hint={siteCtr.hint}
              />
              <StatCard
                label="Просмотры"
                value={views.value}
                delta={views.delta}
                hint={views.hint}
              />
              <StatCard
                label="Удержание · 3 сек"
                value={retention.value}
                delta={retention.delta}
                hint={retention.hint}
              />
              <StatCard
                label="Переходы на сайт"
                value={siteClicks.value}
                delta={siteClicks.delta}
                hint={siteClicks.hint}
              />
            </div>
          </section>

          <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(310px,0.8fr)]">
            <div
              id="experiments"
              className="min-w-0 overflow-hidden rounded-lg border border-[#dfe2de] bg-white"
            >
              <div className="flex flex-col gap-3 border-b border-[#e6e9e5] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-semibold tracking-[-0.02em] text-[#263530]">
                      Эксперименты
                    </h2>
                    <span className="rounded bg-[#eef0eb] px-1.5 py-0.5 font-mono text-[9px] text-[#6f7b74]">
                      {visibleExperiments.length} строк
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#87918b]">
                    Сравниваем хук и формат по удержанию и переходам.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative block min-w-[190px] flex-1 sm:flex-none">
                    <span className="sr-only">Поиск по экспериментам</span>
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#909a94]">
                      ⌕
                    </span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Найти формат или хук"
                      className="w-full rounded-md border border-[#e0e4df] bg-[#fafbf9] py-1.5 pl-7 pr-2 text-[10px] outline-none placeholder:text-[#9ba39e] focus:border-[#b9c5bc] focus:bg-white"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[#e0e4df] px-1 font-mono text-[8px] text-[#8d9791]">
                      ⌘K
                    </span>
                  </label>
                  <select
                    aria-label="Фильтр по каналу"
                    value={channel}
                    onChange={(event) => setChannel(event.target.value)}
                    className="rounded-md border border-[#e0e4df] bg-white px-2 py-[7px] text-[10px] text-[#63716a] outline-none focus:border-[#b9c5bc]"
                  >
                    {[
                      "Все каналы",
                      "Instagram",
                      "TikTok",
                      "YouTube Shorts",
                    ].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-left">
                  <thead className="bg-[#f7f8f5] text-[9px] font-semibold uppercase tracking-[0.09em] text-[#85908a]">
                    <tr>
                      <th className="w-[78px] px-4 py-2.5">ID / статус</th>
                      <th className="min-w-[240px] px-3 py-2.5">
                        Формат / хук
                      </th>
                      <th className="px-3 py-2.5">Канал</th>
                      <th className="px-3 py-2.5 text-right">Просмотры</th>
                      <th className="px-3 py-2.5 text-right">Удерж. 3с</th>
                      <th className="px-3 py-2.5 text-right">Переходы</th>
                      <th className="px-4 py-2.5 text-right">
                        <button
                          className="whitespace-nowrap text-[#68766e] hover:text-[#283a32]"
                          onClick={() =>
                            setSortDescending((current) => !current)
                          }
                        >
                          Переходы / 1K {sortDescending ? "↓" : "↑"}
                        </button>
                      </th>
                      <th className="px-3 py-2.5 text-right">Выборка</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf0ec]">
                    {visibleExperiments.map((experiment) => {
                      const isSelected = experiment.id === selectedId;
                      const stateColor =
                        experiment.state === "Сигнал"
                          ? "bg-[#e9f2ec] text-[#3f7458]"
                          : experiment.state === "Тест"
                            ? "bg-[#f1f0e9] text-[#77704d]"
                            : "bg-[#edf0f2] text-[#66747b]";
                      return (
                        <tr
                          key={experiment.id}
                          aria-selected={isSelected}
                          onClick={() => setSelectedId(experiment.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedId(experiment.id);
                            }
                          }}
                          tabIndex={0}
                          className={`cursor-pointer transition ${isSelected ? "bg-[#f2f6f1]" : "hover:bg-[#fafbf8]"}`}
                        >
                          <td
                            className="border-l-2 border-transparent px-3 py-3 align-top data-[selected=true]:border-[#b68637]"
                            data-selected={isSelected}
                          >
                            <span className="block font-mono text-[10px] font-semibold text-[#485750]">
                              {experiment.id}
                            </span>
                            <span
                              className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[8px] font-medium ${stateColor}`}
                            >
                              {experiment.state}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <span className="block text-[10px] font-medium text-[#40504a]">
                              {experiment.format}
                            </span>
                            <span className="mt-1 block max-w-[290px] truncate text-[11px] text-[#7c8781]">
                              {experiment.hook}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-top text-[10px] text-[#64726b]">
                            {experiment.channel}
                          </td>
                          <td className="px-3 py-3 text-right align-top font-mono text-[10px] tabular-nums text-[#4e5d55]">
                            {experiment.views
                              ? formatNumber(experiment.views)
                              : "—"}
                          </td>
                          <td className="px-3 py-3 text-right align-top font-mono text-[10px] tabular-nums text-[#4e5d55]">
                            {experiment.hold ? `${experiment.hold}%` : "—"}
                          </td>
                          <td className="px-3 py-3 text-right align-top font-mono text-[10px] tabular-nums text-[#4e5d55]">
                            {experiment.clicks
                              ? formatNumber(experiment.clicks)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right align-top font-mono text-[10px] tabular-nums font-semibold text-[#345b49]">
                            {experiment.ctr ? experiment.ctr.toFixed(1) : "—"}
                          </td>
                          <td className="px-3 py-3 text-right align-top text-[9px] text-[#6f7a73]">
                            {experiment.confidence}
                          </td>
                        </tr>
                      );
                    })}
                    {visibleExperiments.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-[11px] text-[#7d8982]"
                        >
                          По этому запросу ничего не найдено.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0ec] bg-[#fbfcfa] px-4 py-2.5 text-[9px] text-[#89938d] sm:px-5">
                <span>
                  Медиана переходов:{" "}
                  <b className="font-mono font-semibold text-[#5a6b60]">
                    5,4 / 1K
                  </b>{" "}
                  <span className="rounded bg-[#f1e8d5] px-1 py-0.5 text-[8px] text-[#866528]">
                    ДЕМО
                  </span>
                </span>
                <span>Сортировка: переходы на 1K просмотров</span>
              </div>
            </div>

            <aside
              aria-label="Инспектор выбранного ролика"
              className="overflow-hidden rounded-lg border border-[#dfe2de] bg-white"
            >
              <div className="flex items-center justify-between border-b border-[#e7eae6] px-4 py-3.5">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#89938d]">
                    Инспектор ролика
                  </div>
                  <h2 className="mt-1 font-mono text-[12px] font-semibold text-[#425149]">
                    {selected.id}
                    <span className="mx-1.5 text-[#c4cac4]">/</span>
                    {selected.format}
                  </h2>
                </div>
                <span className="rounded border border-[#e5d9be] bg-[#f8f2e4] px-1.5 py-1 font-mono text-[8px] tracking-[0.1em] text-[#8c6c32]">
                  ДЕМО
                </span>
              </div>
              <div className="grid grid-cols-[106px_1fr] gap-4 p-4">
                <div className="relative aspect-[9/16] overflow-hidden rounded-md border border-[#d5d9d2] bg-[#e5e2d7] shadow-inner">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(160deg, ${selected.color} 0%, #283a34 64%, #172421 100%)`,
                    }}
                  />
                  <div className="absolute inset-x-2 top-2 flex items-center justify-between font-mono text-[6px] tracking-[0.1em] text-white/70">
                    <span>
                      VZ /{" "}
                      {selected.channel === "Instagram"
                        ? "REELS"
                        : selected.channel === "TikTok"
                          ? "TIKTOK"
                          : "SHORTS"}
                    </span>
                    <span>00:18</span>
                  </div>
                  <div className="absolute left-2 top-[32%] right-2 border-l-2 border-[#e2c27f] pl-2 text-[11px] font-bold leading-[1.15] tracking-[-0.035em] text-white">
                    {selected.hook}
                  </div>
                  <div className="absolute inset-x-2 bottom-3">
                    <div className="mb-1.5 h-[2px] bg-white/25">
                      <div className="h-full w-2/3 bg-[#e1c17c]" />
                    </div>
                    <span className="font-mono text-[6px] tracking-[0.1em] text-white/60">
                      ПРЕВЬЮ · МАКЕТ
                    </span>
                  </div>
                  <div className="absolute bottom-8 right-2 flex flex-col gap-2 text-[8px] text-white/80">
                    <span>♡ 2.4k</span>
                    <span>↗ 126</span>
                  </div>
                </div>
                <div className="min-w-0 pt-0.5">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#909992]">
                    Гипотеза
                  </div>
                  <p className="mt-1.5 text-[11px] leading-[1.55] text-[#42514a]">
                    Конкретный результат в первой фразе приводит более
                    мотивированный трафик.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-y border-[#edf0ec] py-3">
                    <div>
                      <span className="block text-[9px] text-[#8a948e]">
                        Удержание 3с
                      </span>
                      <b className="mt-1 block font-mono text-[13px] font-medium text-[#394b42]">
                        {selected.hold ? `${selected.hold}%` : "—"}
                      </b>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#8a948e]">
                        Переходы / 1K
                      </span>
                      <b className="mt-1 block font-mono text-[13px] font-medium text-[#394b42]">
                        {selected.ctr ? selected.ctr.toFixed(1) : "—"}
                      </b>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#8a948e]">
                        Выборка
                      </span>
                      <b className="mt-1 block text-[10px] font-medium text-[#6c776f]">
                        {selected.confidence}
                      </b>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#8a948e]">
                        Источник
                      </span>
                      <b className="mt-1 block text-[10px] font-medium text-[#6c776f]">
                        Демо-ряд
                      </b>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#909992]">
                      Следующий шаг
                    </div>
                    <p className="mt-1.5 text-[10px] leading-[1.55] text-[#58665f]">
                      {selected.next}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.85fr)]">
            <div
              id="queue"
              className="overflow-hidden rounded-lg border border-[#dfe2de] bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e7eae6] px-4 py-3.5 sm:px-5">
                <div>
                  <h2 className="text-[13px] font-semibold text-[#2e3e37]">
                    Очередь производства
                  </h2>
                  <p className="mt-1 text-[10px] text-[#8a948e]">
                    Состояние сценария до публикации.
                  </p>
                </div>
                <button
                  onClick={() => setShowOnlyAttention((current) => !current)}
                  aria-pressed={showOnlyAttention}
                  className={`rounded border px-2 py-1 text-[9px] transition ${showOnlyAttention ? "border-[#dbc891] bg-[#f8f1df] text-[#82672e]" : "border-[#e1e5e0] text-[#758078] hover:bg-[#f8f9f6]"}`}
                >
                  {showOnlyAttention
                    ? "Показаны неготовые · сбросить"
                    : "Требуют внимания"}
                </button>
              </div>
              <div className="divide-y divide-[#edf0ec]">
                {visibleQueue.map((item) => (
                  <div
                    key={item.time}
                    className="grid grid-cols-[54px_minmax(0,1fr)_90px] items-center gap-3 px-4 py-3 sm:grid-cols-[62px_minmax(0,1fr)_120px_100px] sm:px-5"
                  >
                    <time className="font-mono text-[10px] tabular-nums text-[#7c8981]">
                      СЕГОДНЯ
                      <br />
                      <b className="text-[12px] font-medium text-[#3c4c44]">
                        {item.time}
                      </b>
                    </time>
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-medium text-[#435149]">
                        {item.title}
                      </div>
                      <div className="mt-1 truncate text-[9px] text-[#929b95]">
                        {item.channel}{" "}
                        <span className="px-1 text-[#c7ccc7]">·</span>{" "}
                        {item.kind}
                      </div>
                    </div>
                    <span
                      className={`justify-self-start rounded px-1.5 py-1 text-[8px] ${item.state === "На проверке" ? "bg-[#edf3ed] text-[#57755f]" : item.state === "Черновик" ? "bg-[#f3efe3] text-[#887245]" : "bg-[#eff0f0] text-[#78817e]"}`}
                    >
                      {item.state}
                    </span>
                    <span className="hidden justify-self-end font-mono text-[8px] tracking-[0.1em] text-[#a0a7a2] sm:block">
                      ДЕМО
                    </span>
                  </div>
                ))}
                {visibleQueue.length === 0 && (
                  <p className="px-5 py-6 text-[11px] text-[#7d8982]">
                    В очереди нет элементов.
                  </p>
                )}
              </div>
              <div className="border-t border-[#edf0ec] px-4 py-2 text-[9px] text-[#929b95] sm:px-5">
                Расписание демонстрационное; каналы и автопубликация не
                подключены.
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#dfe2de] bg-white">
              <div className="flex items-center justify-between border-b border-[#e7eae6] px-4 py-3.5">
                <div>
                  <h2 className="text-[13px] font-semibold text-[#2e3e37]">
                    Сигналы и действия
                  </h2>
                  <p className="mt-1 text-[10px] text-[#8a948e]">
                    Что проверить перед следующим циклом.
                  </p>
                </div>
                <span className="rounded bg-[#f1e8d5] px-1.5 py-1 font-mono text-[8px] text-[#866528]">
                  ДЕМО
                </span>
              </div>
              <div className="divide-y divide-[#edf0ec]">
                {signals.map((signal) => (
                  <div className="flex gap-3 px-4 py-3" key={signal.label}>
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-[2px] ${signal.tone === "amber" ? "bg-[#bd9141]" : signal.tone === "red" ? "bg-[#bf6559]" : "bg-[#6384a2]"}`}
                    />
                    <div>
                      <div className="text-[10px] font-semibold text-[#526159]">
                        {signal.label}
                      </div>
                      <p className="mt-1 text-[10px] leading-[1.5] text-[#7d8982]">
                        {signal.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#edf0ec] px-4 py-2 text-[9px] text-[#929b95]">
                Рекомендации демонстрационные; автоматической оптимизации нет.
              </div>
            </div>
          </section>

          <section
            id="documents"
            className="overflow-hidden rounded-lg border border-[#dfe2de] bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e7eae6] px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-[13px] font-semibold text-[#2e3e37]">
                  Решения и документация
                </h2>
                <p className="mt-1 text-[10px] text-[#8a948e]">
                  Источник правды проекта · читается из docs/ при запросе.
                </p>
              </div>
              <span className="font-mono text-[9px] text-[#8e9992]">
                {decisions.length} РЕШЕНИЙ
              </span>
            </div>
            <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="border-b border-[#edf0ec] lg:border-b-0 lg:border-r">
                <h3 className="px-4 pt-4 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#8b9690] sm:px-5">
                  Последние решения
                </h3>
                <ul
                  className="divide-y divide-[#edf0ec] px-4 pb-2 sm:px-5"
                  data-testid="decision-list"
                >
                  {decisions.map((decision, index) => (
                    <li
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-3"
                      key={`${decision.date}-${decision.name}-${index}`}
                    >
                      <time className="font-mono text-[9px] tabular-nums text-[#87928b]">
                        {decision.date}
                      </time>
                      <span className="text-[10px] font-semibold text-[#46564e]">
                        {decision.title}
                      </span>
                      <span className="text-[9px] text-[#909993]">
                        {decision.name} · {decision.agent}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid sm:grid-cols-2">
                <details className="group border-b border-[#edf0ec] p-4 open:bg-[#fcfcfa] sm:border-b-0 sm:border-r sm:p-5">
                  <summary className="cursor-pointer list-none text-[10px] font-semibold text-[#59675f] marker:hidden">
                    <span className="mr-2 inline-block font-mono text-[#aa813b] group-open:rotate-90">
                      ›
                    </span>
                    Спецификация проекта
                  </summary>
                  <article
                    className="mt-3 max-h-[420px] overflow-auto space-y-3 text-[10px] leading-5 text-[#707c75] [&_h1]:mb-2 [&_h1]:text-[14px] [&_h1]:font-semibold [&_h1]:text-[#34453c] [&_h2]:mt-4 [&_h2]:font-semibold [&_h2]:text-[#526159] [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_ul]:space-y-1"
                    dangerouslySetInnerHTML={{ __html: readmeHtml }}
                  />
                </details>
                <details className="group p-4 open:bg-[#fcfcfa] sm:p-5">
                  <summary className="cursor-pointer list-none text-[10px] font-semibold text-[#59675f]">
                    <span className="mr-2 inline-block font-mono text-[#aa813b] group-open:rotate-90">
                      ›
                    </span>
                    Полный журнал
                  </summary>
                  <article
                    className="mt-3 max-h-[420px] overflow-auto space-y-3 text-[10px] leading-5 text-[#707c75] [&_h1]:mb-2 [&_h1]:text-[14px] [&_h1]:font-semibold [&_h1]:text-[#34453c] [&_h2]:mt-4 [&_h2]:font-semibold [&_h2]:text-[#526159] [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_ul]:space-y-1"
                    dangerouslySetInnerHTML={{ __html: journalHtml }}
                  />
                </details>
              </div>
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e0e4df] pt-3 pb-5 text-[9px] text-[#909993]">
            <span>
              VIDEOZAVOD <span className="px-1.5 text-[#c5cbc5]">/</span>{" "}
              локальная админка <span className="px-1.5 text-[#c5cbc5]">/</span>{" "}
              источники публикаций не подключены
            </span>
            <span>
              Публичный сайт{" "}
              <a
                className="font-medium text-[#687b70] underline decoration-[#c2ccc4] underline-offset-2"
                href="https://vibecoding.tech"
                target="_blank"
                rel="noreferrer"
              >
                vibecoding.tech ↗
              </a>
            </span>
          </footer>
        </div>
      </div>
      {commandOpen && (
        <div
          className="fixed inset-0 z-30 flex items-start justify-center bg-[#1e2925]/25 px-4 pt-[16vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCommandOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-lg border border-[#dfe4de] bg-white p-3 shadow-[0_20px_70px_rgba(25,40,33,0.2)]">
            <div className="px-2 pb-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#87918b]">
              Быстрый поиск по экспериментам
            </div>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setCommandOpen(false);
                  document
                    .getElementById("experiments")
                    ?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              placeholder="Введите формат, хук или ID…"
              className="w-full rounded-md border border-[#dfe4de] bg-[#fafbf9] px-3 py-2.5 text-[12px] outline-none focus:border-[#aebdb2]"
            />
            <div className="flex justify-between px-2 pt-2 text-[9px] text-[#909993]">
              <span>Enter · перейти к результатам</span>
              <span>Esc · закрыть</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
