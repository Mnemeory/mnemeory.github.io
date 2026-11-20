const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

const STATUS_CLASSES = {
  HOSTILE: "status-hostile",
  MONITORED: "status-monitored",
  NEUTRAL: "status-neutral",
  CONTAINED: "status-contained"
};

export function createWatchtowerNode({
  viewEl,
  subNavEl,
  searchEl,
  bodyEl,
  notesDialogEl,
  notesTitleEl,
  notesListEl,
  closeNotesEl
}) {
  let records = [];

  function getNotes(row) {
    if (Array.isArray(row.notes)) return row.notes;
    return row.notes ? [row.notes] : [];
  }

  function openNotes(row) {
    notesTitleEl.textContent = row.name ?? "Unknown";
    const fragment = document.createDocumentFragment();
    for (const note of getNotes(row)) {
      const item = document.createElement("li");
      item.append(document.createTextNode(String(typeof note === "string" ? note : note?.text ?? "")));
      if (typeof note === "object" && note?.author) {
        const author = document.createElement("span");
        author.className = "note-meta";
        author.textContent = `Added by ${note.author}`;
        item.append(author);
      }
      if (typeof note === "object" && note?.addedAt) {
        const time = document.createElement("time");
        time.className = "note-meta";
        time.dateTime = note.addedAt;
        const date = new Date(`${note.addedAt}T12:00:00Z`);
        time.textContent = Number.isNaN(date.valueOf())
          ? note.addedAt
          : new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeZone: "UTC" }).format(date);
        item.append(time);
      }
      fragment.append(item);
    }
    notesListEl.replaceChildren(fragment);
    notesDialogEl.showModal();
  }

  closeNotesEl.addEventListener("click", () => notesDialogEl.close());
  notesDialogEl.addEventListener("click", (event) => {
    if (event.target === notesDialogEl) notesDialogEl.close();
  });

  function renderRows() {
    const q = searchEl.value.trim().toLowerCase();

    const rows = records
      .filter((row) =>
        [
          row.name,
          row.affiliation,
          row.traces,
          row.status,
          ...getNotes(row).map((note) => typeof note === "string" ? note : note?.text)
        ]
          .some((val) => String(val ?? "").toLowerCase().includes(q))
      )
      .sort((a, b) => collator.compare(a.name ?? "", b.name ?? ""));

    const fragment = document.createDocumentFragment();

    for (const row of rows) {
      const tr = document.createElement("tr");
      const statusRaw = String(row.status ?? "").trim().toUpperCase();
      const statusClass = STATUS_CLASSES[statusRaw] ?? "";

      if (statusClass) {
        tr.classList.add(`row-${statusClass}`);
      }

      const nameTd = document.createElement("td");
      const nameButton = document.createElement("button");
      const notes = getNotes(row);
      nameButton.type = "button";
      nameButton.className = "person-name";
      nameButton.textContent = row.name ?? "";
      nameButton.setAttribute(
        "aria-label",
        notes.length ? `Open ${notes.length} notes for ${row.name}` : `Open notes for ${row.name}`
      );
      if (notes.length) {
        const marker = document.createElement("span");
        marker.className = "notes-marker";
        marker.textContent = "*";
        marker.setAttribute("aria-hidden", "true");
        nameButton.append(marker);
      }
      nameButton.addEventListener("click", () => openNotes(row));
      nameTd.append(nameButton);

      const affiliationTd = document.createElement("td");
      affiliationTd.textContent = row.affiliation ?? "";

      const tracesTd = document.createElement("td");
      tracesTd.textContent = row.traces ?? "";

      const statusTd = document.createElement("td");
      statusTd.textContent = row.status ?? "";
      if (statusClass) {
        statusTd.className = statusClass;
      }

      tr.append(nameTd, affiliationTd, statusTd, tracesTd);
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
