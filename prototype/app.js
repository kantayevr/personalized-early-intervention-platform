"use strict";
const KEY = "dip8-ryadom-v1";
const sampleTasks = [
  {
    id: 1,
    title: "Игра по очереди",
    duration: "5 минут",
    text: "Выберите знакомую игру и попробуйте действовать по очереди.",
    reason:
      "В демонстрационной анкете родитель отметил интерес к совместной игре.",
  },
  {
    id: 2,
    title: "Выбираем вместе",
    duration: "5 минут",
    text: "Предложите выбрать одну из двух знакомых игрушек для совместной игры.",
    reason:
      "В демонстрационном наблюдении отмечен интерес к самостоятельному выбору.",
  },
  {
    id: 3,
    title: "Смотрим книгу",
    duration: "5 минут",
    text: "Рассмотрите любимую книгу и следуйте за интересом ребёнка.",
    reason: "В демонстрационном профиле указано, что ребёнку нравятся книги.",
  },
];
const fresh = () => ({
  role: null,
  screen: "login",
  form: {
    interest: "Книги и совместные игры",
    routine: "После дневного отдыха",
    request: "Сохранять задания и наблюдения в одном месте",
  },
  draft: structuredClone(sampleTasks),
  reviewed: false,
  published: null,
  status: {},
  history: [],
});
let state;
try {
  state = JSON.parse(localStorage.getItem(KEY)) || fresh();
} catch {
  state = fresh();
}
let roleChoice = "specialist",
  notice = "",
  failNext = false;
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const complete = () => Object.values(state.form).every((x) => x.trim());
function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
function save(mutate, success) {
  if (failNext) {
    failNext = false;
    notice =
      "error:Не удалось сохранить. Изменения не отправлены. Повторите действие — введённые данные остаются на экране.";
    showNotice();
    return false;
  }
  const before = structuredClone(state);
  try {
    mutate();
    persist();
    notice = "success:" + success;
    return true;
  } catch {
    state = before;
    notice =
      "error:Не удалось сохранить в браузере. Проверьте доступность хранилища и повторите.";
    showNotice();
    return false;
  }
}
function showNotice() {
  let n = $("#notice");
  if (n) {
    n.innerHTML = noticeHTML();
    n.scrollIntoView({ block: "nearest" });
  }
}
function noticeHTML() {
  if (!notice) return "";
  const kind = notice.split(":")[0];
  return `<div class="notice ${kind}" role="${kind === "error" ? "alert" : "status"}">${esc(notice.slice(kind.length + 1))}</div>`;
}
function go(screen) {
  state.screen = screen;
  notice = "";
  render();
  window.scrollTo(0, 0);
}
function stats() {
  const tasks = state.published?.tasks || [];
  return {
    total: tasks.length,
    done: tasks.filter((t) => state.status[t.id] === "done").length,
    skipped: tasks.filter((t) => state.status[t.id] === "skipped").length,
  };
}
function step(n) {
  return `<div class="steps">${["Данные и наблюдения", "Предложения", "Проверка и публикация"].map((t, i) => `<span class="${i + 1 === n ? "current" : ""}"><b>${i + 1}</b>${t}</span>`).join("")}</div>`;
}
function heading(k, h, p, b = "") {
  return `<div class="heading"><div><div class="eyebrow">${k}</div><h1>${h}</h1><p class="muted">${p}</p></div>${b}</div>`;
}
function profile() {
  return `${state.role === "specialist" ? step(1) : ""}${heading("Профиль ребёнка", "Знакомимся с Мирой", "Вымышленный профиль · демо № 001", `<span class="badge ${complete() ? "" : "amber"}">${complete() ? "Анкета заполнена" : "Анкета не завершена"}</span>`)}${!complete() ? '<div class="notice">В анкете не хватает ответов. Предложения станут доступны после заполнения.</div>' : ""}<div class="grid"><div><section class="card"><div class="person"><span class="avatar">М</span><div><h2 style="margin:0">Мира</h2><small>Условное имя · 3 года · демонстрационные данные</small></div></div><div class="facts"><div><small>Что нравится</small>${esc(state.form.interest) || "Не заполнено"}</div><div><small>Удобное время</small>${esc(state.form.routine) || "Не заполнено"}</div><div><small>Запрос родителя</small>${esc(state.form.request) || "Не заполнено"}</div><div><small>Специалист</small>Анна · вымышленный участник</div></div><div class="actions"><button data-go="questionnaire">${state.role === "parent" ? "Изменить анкету" : "Посмотреть анкету"}</button></div></section><section class="card"><div class="row"><h2>Наблюдения</h2><span class="badge gray">2 записи · пример</span></div><div class="observation"><small class="muted"><span class="dot"></span>22 октября · родитель</small><p>Мира сама выбрала книгу для совместной игры.</p></div><div class="observation"><small class="muted"><span class="dot"></span>21 октября · специалист</small><p>В демонстрационном занятии проявила интерес к игре по очереди.</p></div></section></div><aside><section class="card soft"><div class="eyebrow">Следующий шаг</div><h2>${state.role === "specialist" ? "Подготовить общий план" : "План на каждый день"}</h2><p>${state.role === "specialist" ? "Посмотрите предложения, выберите подходящие задания и проверьте их перед публикацией." : "После проверки специалистом здесь появится план с понятными заданиями."}</p><button class="primary" ${state.role === "specialist" && !complete() ? "disabled" : ""} data-go="${state.role === "specialist" ? "suggestions" : "plan"}">${state.role === "specialist" ? "Посмотреть предложения →" : "Открыть план →"}</button></section><p class="muted" style="font-size:12px">Направление проекта — предположение до подтверждения руководителем. Содержание заданий иллюстрирует интерфейс.</p></aside></div>`;
}
function questionnaire() {
  const readonly = state.role === "specialist";
  return `${heading("Анкета", "Что важно знать о ребёнке", "Только вымышленные ответы. Не вводите персональные или медицинские сведения.")}<div class="grid"><section class="card"><form id="questionnaire-form"><div class="fields">${[
    ["interest", "Что ребёнку нравится?"],
    ["routine", "Когда удобно заниматься?"],
    ["request", "Что вы хотели бы обсудить со специалистом?"],
  ]
    .map(
      ([key, label]) =>
        `<label>${label} <span class="muted">Обязательное поле</span><textarea name="${key}" ${readonly ? "readonly" : ""}>${esc(state.form[key])}</textarea></label>`,
    )
    .join(
      "",
    )}</div>${!readonly ? '<div class="actions"><button type="submit" class="primary">Сохранить анкету</button><button type="button" data-go="profile">К профилю</button></div>' : '<div class="actions"><button type="button" data-go="profile">Вернуться к профилю</button></div>'}</form></section><aside class="card soft" style="align-self:start"><h2>${complete() ? "Все ответы на месте" : "Анкета не завершена"}</h2><p>Заполнено ${Object.values(state.form).filter((x) => x.trim()).length} из 3 полей.</p><p class="muted">Родитель может сохранить неполную анкету и вернуться позже. Специалист просматривает ответы.</p></aside></div>`;
}
function suggestions() {
  return `${step(2)}${heading("Подбор заданий", "Предложения для плана", "3 демонстрационных предложения на основе вымышленной анкеты.")}<div class="grid"><section class="card">${sampleTasks.map((t) => `<article class="task"><div class="row"><h2>${t.title}</h2><span class="badge gray">${t.duration}</span></div><p>${t.text}</p><div class="reason"><b>Почему предложено</b><br>${t.reason}</div></article>`).join("")}</section><aside><section class="card soft"><h2>Решение за специалистом</h2><p>Предложения не публикуются автоматически. Вы можете изменить текст и длительность или убрать задание.</p><button class="primary" id="edit-plan">Проверить и изменить →</button></section><p class="muted" style="font-size:12px">Подбор фиксированный. Алгоритм рекомендаций в прототип не подключён.</p></aside></div>`;
}
function editor() {
  return `${step(3)}${heading("План · 23 октября", "Проверка перед публикацией", "Черновик доступен только специалисту.", '<span class="badge amber">Черновик</span>')}<form id="plan-form"><div class="grid"><section class="card">${state.draft.map((t, i) => `<article class="task" data-task="${t.id}"><div class="row"><div class="task-number">0${i + 1}</div><button type="button" data-remove="${t.id}" aria-label="Убрать задание ${esc(t.title)}">Убрать</button></div><div class="fields"><label>Название<input name="title-${t.id}" value="${esc(t.title)}" required></label><label>Длительность<input name="duration-${t.id}" value="${esc(t.duration)}" required></label><label>Инструкция для родителя<textarea name="text-${t.id}" required>${esc(t.text)}</textarea></label></div></article>`).join("") || "<p>В плане нет заданий. Вернитесь к предложениям, чтобы добавить их.</p>"}<button type="button" id="restore-tasks" class="link">Вернуть исходные предложения</button></section><aside><section class="card soft"><h2>Готово к передаче?</h2><p>Проверьте формулировки, длительность и соответствие запросу семьи.</p><label class="check"><input type="checkbox" id="reviewed" ${state.reviewed ? "checked" : ""}>Я проверил(а) все задания и подтверждаю публикацию плана.</label><div class="actions"><button class="primary" type="submit" name="intent" value="publish" ${!state.draft.length ? "disabled" : ""}>Опубликовать план</button><button type="submit" name="intent" value="draft">Сохранить черновик</button></div><p class="muted" style="font-size:12px;margin-top:18px">Родитель увидит только опубликованную версию. Повторная публикация создаёт новую версию и начинает новую сводку.</p></section></aside></div></form>`;
}
function plan() {
  if (!state.published)
    return `${heading("План занятий", "Пока нет опубликованного плана", "Здесь появятся задания после проверки специалистом.")}<section class="card empty"><div class="symbol">◷</div><h2>План ещё готовится</h2><p class="muted">Когда специалист опубликует план,<br>вы сможете просмотреть задания и отметить выполнение.</p><button data-go="profile">Посмотреть профиль</button></section>`;
  const s = stats();
  return `${heading("План · версия " + state.published.version, "Небольшие шаги, вместе", "23 октября 2026 · проверено специалистом", '<span class="badge">Опубликован</span>')}<div class="grid"><section class="card"><div class="row"><h2>Задания на сегодня</h2><span class="badge gray">${s.total} задания</span></div>${state.published.tasks.map((t, i) => `<article class="task"><div class="row"><h2>${i + 1}. ${esc(t.title)}</h2><span class="badge gray">${esc(t.duration)}</span></div><p>${esc(t.text)}</p><div class="reason"><b>Почему в плане</b><br>${esc(t.reason)}</div>${state.role === "parent" ? `<div class="task-buttons"><button data-mark="${t.id}" data-status="done" class="${state.status[t.id] === "done" ? "selected" : ""}" aria-pressed="${state.status[t.id] === "done"}">✓ Выполнено</button><button data-mark="${t.id}" data-status="skipped" class="${state.status[t.id] === "skipped" ? "selected" : ""}" aria-pressed="${state.status[t.id] === "skipped"}">Пропущено</button>${state.status[t.id] ? `<button data-mark="${t.id}" data-status="" aria-label="Снять отметку с задания ${esc(t.title)}">Снять отметку</button>` : ""}</div>` : `<span class="badge">${state.status[t.id] === "done" ? "Выполнено" : state.status[t.id] === "skipped" ? "Пропущено" : "Без отметки"}</span>`}</article>`).join("")}</section><aside><section class="card soft"><div class="eyebrow">Сегодня</div><h2>${s.done} из ${s.total} выполнено</h2><div class="progress"><i style="width:${(s.done / s.total) * 100}%"></i></div><p>${s.skipped} пропущено · ${s.total - s.done - s.skipped} без отметки</p><p class="muted" style="font-size:12px">Это сводка выполнения заданий, а не оценка развития ребёнка.</p><button data-go="history">История и сводка →</button></section>${state.role === "specialist" ? '<button id="new-draft">Редактировать новый черновик</button>' : ""}</aside></div>`;
}
function history() {
  const s = stats();
  return `${heading("История и сводка", "Как прошли занятия", "Отметки помогают подготовиться к следующей встрече.")}<div class="metrics"><div class="metric"><small>Выполнено</small><strong>${s.done}</strong></div><div class="metric"><small>Пропущено</small><strong>${s.skipped}</strong></div><div class="metric"><small>Без отметки</small><strong>${s.total - s.done - s.skipped}</strong></div></div><div class="grid"><section class="card"><h2>История изменений</h2><div class="timeline">${
    state.history.length
      ? state.history
          .slice()
          .reverse()
          .map(
            (h) =>
              `<article><small>${esc(h.time)} · ${h.role === "parent" ? "Родитель" : "Специалист"}${h.version ? " · версия " + h.version : ""}</small><p>${esc(h.text)}</p></article>`,
          )
          .join("")
      : '<p class="muted">Здесь появятся публикации и отметки выполнения.</p>'
  }</div></section><aside><section class="card soft"><h2>${s.total ? ((s.done / s.total) * 100).toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "% заданий выполнено" : "Нет назначенных заданий"}</h2><div class="progress"><i style="width:${s.total ? (s.done / s.total) * 100 : 0}%"></i></div><p class="muted">Выполненные задания / все задания текущей опубликованной версии. Пропущенные остаются в общем количестве.</p><p>Процент отражает только выполнение плана и не является оценкой развития ребёнка.</p><button data-go="plan">Открыть план</button></section></aside></div>`;
}
function demoPanel() {
  return `<details class="demo"><summary>Проверка прототипа · сценарии и особые состояния</summary><p class="muted" style="font-size:12px;margin-top:12px">Элементы ниже предназначены для демонстрации и не входят в рабочий интерфейс.</p><div class="actions"><button data-demo="incomplete">Неполная анкета</button><button data-demo="empty">Нет опубликованного плана</button><button data-demo="error">Ошибка следующего сохранения</button><button data-demo="specialist">Сценарий специалиста с начала</button><button data-demo="parent">Сценарий родителя с готовым планом</button><button data-demo="reset">Сбросить демо</button></div></details>`;
}
function login() {
  return `<div class="login"><section class="welcome"><div class="brand"><span class="brandmark">↗</span>рядом</div><div class="eyebrow" style="margin-top:25px">Семья и специалист · в одном ритме</div><h1>Общий план.<br>Больше ясности.</h1><p>Задания, наблюдения и маленькие шаги — в одном пространстве для семьи и специалиста.</p><div class="art" aria-hidden="true"><span></span><span></span><span></span></div><p style="font-size:12px;margin-top:auto">Учебный прототип DIP-8 · направление проекта уточняется</p></section><section class="login-form"><span class="eyebrow">Добро пожаловать</span><h1>Войти в пространство</h1><p class="muted">Выберите роль, чтобы пройти сценарий.</p><div class="roles"><button data-role="specialist" class="${roleChoice === "specialist" ? "selected" : ""}" aria-pressed="${roleChoice === "specialist"}">Специалист<small>Проверить и опубликовать план</small></button><button data-role="parent" class="${roleChoice === "parent" ? "selected" : ""}" aria-pressed="${roleChoice === "parent"}">Родитель<small>Открыть план и отметить задания</small></button></div><button class="primary" id="login">Войти в демо →</button><p class="login-foot">Вход демонстрационный, пароль не нужен. Все персонажи и сведения вымышлены. Данные сохраняются только в этом браузере.</p><a href="#" id="reset-login">Начать демонстрацию заново</a></section></div>`;
}
function render() {
  if (!state.role || state.screen === "login") {
    $("#app").innerHTML = login();
    bind();
    return;
  }
  if (
    ["suggestions", "editor"].includes(state.screen) &&
    state.role !== "specialist"
  )
    state.screen = "plan";
  if (state.screen === "suggestions" && !complete()) state.screen = "profile";
  const pages = { profile, questionnaire, suggestions, editor, plan, history };
  const active = state.screen;
  $("#app").innerHTML =
    `<div class="shell"><aside class="sidebar"><div><div class="brand"><span class="brandmark">↗</span>рядом</div><div class="subtitle">Общий план. Маленькие шаги.</div></div><div class="person"><span class="avatar">М</span><div><b>Мира</b><small>Вымышленный профиль</small></div></div><nav class="nav" aria-label="Основная навигация">${[
      ["profile", "◉", "Профиль ребёнка"],
      ["questionnaire", "▤", "Анкета"],
      ["plan", "▦", "План занятий"],
      ["history", "◷", "История и сводка"],
    ]
      .map(
        ([page, icon, label]) =>
          `<button data-go="${page}" class="${active === page ? "active" : ""}" ${active === page ? 'aria-current="page"' : ""}><span aria-hidden="true">${icon}</span>${label}</button>`,
      )
      .join(
        "",
      )}</nav><div class="foot">Учебный прототип · DIP-8<br>Только вымышленные данные<br>23 октября 2026</div></aside><div class="workspace"><header class="topbar"><div><b>${state.role === "specialist" ? "Кабинет специалиста" : "Кабинет родителя"}</b><br><small>${state.role === "specialist" ? "Анна · демо" : "Семья Миры · демо"}</small></div><div class="row"><span class="badge gray">Прототип</span><button id="switch-role">Сменить роль</button></div></header><main><div id="notice" aria-live="polite">${noticeHTML()}</div>${(pages[active] || profile)()}${demoPanel()}</main></div></div>`;
  bind();
}
function captureDraft() {
  const form = $("#plan-form");
  if (!form) return;
  state.draft = state.draft.map((t) => ({
    ...t,
    title: form.elements["title-" + t.id].value.trim(),
    duration: form.elements["duration-" + t.id].value.trim(),
    text: form.elements["text-" + t.id].value.trim(),
  }));
  state.reviewed = $("#reviewed").checked;
}
function event(text) {
  return {
    text,
    role: state.role,
    version: state.published?.version,
    time: new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Almaty",
    }).format(new Date()),
  };
}
function bind() {
  document
    .querySelectorAll("[data-go]")
    .forEach((b) => (b.onclick = () => go(b.dataset.go)));
  document.querySelectorAll("[data-role]").forEach(
    (b) =>
      (b.onclick = () => {
        roleChoice = b.dataset.role;
        render();
      }),
  );
  if ($("#login"))
    $("#login").onclick = () => {
      state.role = roleChoice;
      go(state.role === "specialist" ? "profile" : "plan");
    };
  if ($("#switch-role"))
    $("#switch-role").onclick = () => {
      state.screen = "login";
      render();
    };
  if ($("#reset-login"))
    $("#reset-login").onclick = (e) => {
      e.preventDefault();
      state = fresh();
      try {
        persist();
      } catch {}
      render();
    };
  if ($("#questionnaire-form"))
    $("#questionnaire-form").onsubmit = (e) => {
      e.preventDefault();
      if (state.role !== "parent") return;
      const form = new FormData(e.target);
      if (
        save(() => {
          state.form = Object.fromEntries(
            ["interest", "routine", "request"].map((k) => [
              k,
              String(form.get(k)).trim(),
            ]),
          );
        }, "Анкета сохранена.")
      )
        render();
    };
  if ($("#edit-plan")) $("#edit-plan").onclick = () => go("editor");
  if ($("#restore-tasks"))
    $("#restore-tasks").onclick = () => {
      state.draft = structuredClone(sampleTasks);
      state.reviewed = false;
      render();
    };
  document.querySelectorAll("[data-remove]").forEach(
    (b) =>
      (b.onclick = () => {
        captureDraft();
        state.draft = state.draft.filter(
          (t) => t.id !== Number(b.dataset.remove),
        );
        state.reviewed = false;
        render();
      }),
  );
  if ($("#plan-form")) {
    $("#plan-form").oninput = () => {
      state.reviewed = false;
      $("#reviewed").checked = false;
    };
    $("#reviewed").oninput = (e) => e.stopPropagation();
    $("#plan-form").onsubmit = (e) => {
      e.preventDefault();
      if (state.role !== "specialist") return;
      captureDraft();
      if (e.submitter?.value === "publish") {
        if (!complete()) {
          notice = "error:Сначала необходимо заполнить анкету.";
          showNotice();
          return;
        }
        if (!state.reviewed) {
          notice = "error:Подтвердите проверку заданий перед публикацией.";
          showNotice();
          return;
        }
        if (!state.draft.length) return;
        if (
          save(() => {
            state.published = {
              version: (state.published?.version || 0) + 1,
              tasks: structuredClone(state.draft),
            };
            state.status = {};
            state.history.push(event("Опубликован план занятий"));
            state.screen = "plan";
          }, "План опубликован. Родитель теперь видит проверенную версию.")
        )
          render();
      } else if (
        save(() => {}, "Черновик сохранён. Он доступен только специалисту.")
      )
        render();
    };
  }
  if ($("#new-draft"))
    $("#new-draft").onclick = () => {
      state.draft = structuredClone(state.published.tasks);
      state.reviewed = false;
      go("editor");
    };
  document.querySelectorAll("[data-mark]").forEach(
    (b) =>
      (b.onclick = () => {
        if (state.role !== "parent") return;
        const id = Number(b.dataset.mark),
          status = b.dataset.status;
        if (state.status[id] === status) return;
        if (
          save(() => {
            state.status[id] = status;
            state.history.push(
              event(
                `${state.published.tasks.find((t) => t.id === id).title} — ${status === "done" ? "выполнено" : status === "skipped" ? "пропущено" : "отметка снята"}`,
              ),
            );
          }, "Отметка сохранена. Сводка обновлена.")
        )
          render();
      }),
  );
  document.querySelectorAll("[data-demo]").forEach(
    (b) =>
      (b.onclick = () => {
        const action = b.dataset.demo;
        notice = "";
        if (action === "error") {
          failNext = true;
          notice =
            "success:Включена демонстрация ошибки: следующее сохранение завершится неудачей. Повторное действие сработает.";
          showNotice();
          return;
        }
        failNext = false;
        if (action === "incomplete") {
          state.form.request = "";
          state.role = "parent";
          state.screen = "questionnaire";
        }
        if (action === "empty") {
          state.published = null;
          state.status = {};
          state.history = [];
          state.role = "parent";
          state.screen = "plan";
        }
        if (action === "specialist") {
          state = fresh();
          state.role = "specialist";
          state.screen = "profile";
        }
        if (action === "parent") {
          state = fresh();
          state.role = "parent";
          state.screen = "plan";
          state.published = { version: 1, tasks: structuredClone(sampleTasks) };
          state.history = [
            {
              text: "Опубликован план занятий · демонстрационный пример",
              role: "specialist",
              version: 1,
              time: "23 октября, 10:00",
            },
          ];
        }
        if (action === "reset") state = fresh();
        try {
          persist();
        } catch {}
        render();
      }),
  );
}
render();
