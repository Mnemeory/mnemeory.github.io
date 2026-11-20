export function createSchoolhouseNode({
  viewEl,
  subNavEl,
  previewEl,
  sourceEl,
  highlightEl,
  hoverTipEl,
  copyBtn,
  downloadBtn
}) {
  let entries = [];
  let activeIndex = 0;

  function updateHighlight(code) {
    highlightEl.replaceChildren();
    const parts = code.split(/(\[AGENT NAME\])/g);

    for (const part of parts) {
      if (part === "[AGENT NAME]") {
        const span = document.createElement("span");
        span.className = "hl-token";
        span.textContent = part;
        highlightEl.append(span);
      } else if (part) {
        highlightEl.append(document.createTextNode(part));
      }
    }

    if (code.endsWith("\n")) {
      highlightEl.append(document.createTextNode(" "));
    }
  }

  function selectEntry(idx) {
    const item = entries[idx];
    if (!item) return;

    activeIndex = idx;
    for (const btn of subNavEl.querySelectorAll("button")) {
      btn.classList.toggle("active", btn.dataset.svgIndex === String(idx));
    }

    previewEl.innerHTML = item.svgText;
    sourceEl.value = item.svgText;
    updateHighlight(item.svgText);
  }

  sourceEl.addEventListener("input", () => {
    const item = entries[activeIndex];
    if (!item) return;
    item.svgText = sourceEl.value;
    previewEl.innerHTML = sourceEl.value;
    updateHighlight(sourceEl.value);
  });

  sourceEl.addEventListener("scroll", () => {
    highlightEl.scrollTop = sourceEl.scrollTop;
    highlightEl.scrollLeft = sourceEl.scrollLeft;
  });

  sourceEl.addEventListener("mousemove", (e) => {
    const overToken = [...highlightEl.querySelectorAll(".hl-token")].some((token) => {
      const rect = token.getBoundingClientRect();
      return (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
    });

    hoverTipEl.hidden = !overToken;
    if (overToken) {
      hoverTipEl.style.left = `${e.clientX + 12}px`;
      hoverTipEl.style.top = `${e.clientY + 12}px`;
    }
  });

  sourceEl.addEventListener("mouseleave", () => {
    hoverTipEl.hidden = true;
  });

  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(sourceEl.value);
    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy SVG";
    }, 1200);
  });

  downloadBtn.addEventListener("click", () => {
    const item = entries[activeIndex];
    if (!item) return;
    const blob = new Blob([sourceEl.value], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.file.split("/").pop() || `${item.id}.svg`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  return {
    setData(items) {
      entries = Array.isArray(items) ? items : [];
      if (activeIndex >= entries.length) activeIndex = 0;
    },
    renderSubNav() {
      const fragment = document.createDocumentFragment();

      entries.forEach((item, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = item.label;
        btn.dataset.svgIndex = String(idx);
        btn.classList.toggle("active", idx === activeIndex);
        btn.addEventListener("click", () => selectEntry(idx));
        fragment.append(btn);
      });

      subNavEl.replaceChildren(fragment);
    },
    show() {
      viewEl.hidden = entries.length === 0;
      this.renderSubNav();
      if (entries.length > 0) {
        selectEntry(activeIndex);
      }
    },
    hide() {
      hoverTipEl.hidden = true;
      viewEl.hidden = true;
    }
  };
}
