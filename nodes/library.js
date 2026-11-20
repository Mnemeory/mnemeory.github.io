export function createLibraryNode({ viewEl, subNavEl }) {
  return {
    renderSubNav() {
      subNavEl.replaceChildren();
    },
    show() {
      viewEl.hidden = false;
      this.renderSubNav();
    },
    hide() {
      viewEl.hidden = true;
    }
  };
}
