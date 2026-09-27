const workspaceTitle = document.querySelector("#workspace-title");
const boardTitle = document.querySelector("#memos-heading");
const viewButtons = [...document.querySelectorAll("[data-view]")];

const VIEW_COPY = Object.freeze({
  active: { workspace: "Capture space", board: "Memos" },
  archived: { workspace: "Archive", board: "Archive" },
  trashed: { workspace: "Trash", board: "Trash" }
});

function applyViewCopy(view) {
  const copy = VIEW_COPY[view] ?? VIEW_COPY.active;
  if (workspaceTitle) workspaceTitle.textContent = copy.workspace;
  if (boardTitle) boardTitle.textContent = copy.board;
  document.body.dataset.memoView = view;
}

for (const button of viewButtons) {
  button.addEventListener("click", () => applyViewCopy(button.dataset.view));
}

applyViewCopy(
  document.querySelector("[data-view][aria-pressed='true']")?.dataset.view ?? "active"
);
