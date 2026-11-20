const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

const STATUS_CLASSES = {
  HOSTILE: "status-hostile",
  MONITORED: "status-monitored",
  NEUTRAL: "status-neutral",
  CONTAINED: "status-contained"
};

export function createWatchtowerNode({ viewEl, subNavEl, searchEl, bodyEl }) {
  let records = [];

  function renderRows() {
    const q = searchEl.value.trim().toLowerCase();

    const rows = records
      .filter((row) =>
        [row.name, row.affiliation, row.traces, row.status]
          .some((val) => String(val ?? "").toLowerCase().includes(q))
      )
      .sort((a, b) => collator.compare(a.name ?? "", b.name ?? ""));

    const fragment = document.createDocumentFragment();

    for (const row of rows) {
      const tr = document.createElement("tr");

      const nameTd = document.createElement("td");
      nameTd.textContent = row.name ?? "";

      const affiliationTd = document.createElement("td");
      affiliationTd.textContent = row.affiliation ?? "";

      const tracesTd = document.createElement("td");
      tracesTd.textContent = row.traces ?? "";

      const statusRaw = String(row.status ?? "").trim().toUpperCase();
      const statusTd = document.createElement("td");
      statusTd.textContent = row.status ?? "";
      if (STATUS_CLASSES[statusRaw]) {
        statusTd.className = STATUS_CLASSES[statusRaw];
      }

      tr.append(nameTd, affiliationTd, tracesTd, statusTd);
      fragment.append(tr);
    }

    bodyEl.replaceChildren(fragment);
  }

  searchEl.addEventListener("input", renderRows);

  return {
    setData(data) {
      records = Array.isArray(data) ? data : [];
    },
    renderSubNav() {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "TRACE DATABASE";
      btn.classList.add("active");
      subNavEl.replaceChildren(btn);
    },
    show() {
      viewEl.hidden = false;
      this.renderSubNav();
      renderRows();
    },
    hide() {
      viewEl.hidden = true;
    }
  };
}
