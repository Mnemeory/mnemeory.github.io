import { createWatchtowerNode } from "./nodes/watchtower.js";
import { createLibraryNode } from "./nodes/library.js";
import { createSchoolhouseNode } from "./nodes/schoolhouse.js";

const NODES = [
  { id: "watchtower", label: "NODE-01-WATCHTOWER" },
  { id: "library", label: "NODE-02-LIBRARY" },
  { id: "schoolhouse", label: "NODE-03-SCHOOLHOUSE" }
];

const nodeNavEl = document.getElementById("nodeNav");
const subNavEl = document.getElementById("subNav");

const watchtower = createWatchtowerNode({
  viewEl: document.getElementById("watchtowerView"),
  subNavEl,
  searchEl: document.getElementById("dbSearch"),
  bodyEl: document.getElementById("dbBody"),
  notesDialogEl: document.getElementById("notesDialog"),
  notesTitleEl: document.getElementById("notesTitle"),
  notesListEl: document.getElementById("notesList"),
  closeNotesEl: document.getElementById("closeNotes")
});

const library = createLibraryNode({
  viewEl: document.getElementById("libraryView"),
  subNavEl
});

const schoolhouse = createSchoolhouseNode({
  viewEl: document.getElementById("schoolhouseView"),
  subNavEl,
  previewEl: document.getElementById("preview"),
  sourceEl: document.getElementById("svgSource"),
  highlightEl: document.getElementById("svgHighlight"),
  hoverTipEl: document.getElementById("hoverTip"),
  copyBtn: document.getElementById("copyBtn"),
  downloadBtn: document.getElementById("downloadBtn")
});

const nodeControllers = { watchtower, library, schoolhouse };
let activeNodeId = "watchtower";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.json();
}

function renderNode(id) {
  activeNodeId = id;

  for (const btn of nodeNavEl.querySelectorAll("button")) {
    const isCurrent = btn.dataset.node === id;
    btn.classList.toggle("active", isCurrent);
    btn.setAttribute("aria-current", isCurrent ? "page" : "false");
  }

  for (const [nodeId, controller] of Object.entries(nodeControllers)) {
    if (nodeId === id) {
      controller.show();
    } else {
      controller.hide();
    }
  }
}

async function init() {
  const navFragment = document.createDocumentFragment();
  for (const node of NODES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = node.label;
    btn.dataset.node = node.id;
    btn.addEventListener("click", () => renderNode(node.id));
    navFragment.append(btn);
  }
  nodeNavEl.replaceChildren(navFragment);

  const [manifest, watchtowerData] = await Promise.all([
    fetchJson("./data/badges.json"),
    fetchJson("./data/watchtower.json")
  ]);

  const badgeEntries = await Promise.all(
    manifest.map(async (item) => {
      const res = await fetch(item.file);
      if (!res.ok) throw new Error(`Failed to load ${item.file} (${res.status})`);
      return { ...item, svgText: await res.text() };
    })
  );

  watchtower.setData(watchtowerData);
  schoolhouse.setData(badgeEntries);
  renderNode(activeNodeId);
}

init().catch((err) => {
  console.error(err);
  subNavEl.textContent = err.message;
});
