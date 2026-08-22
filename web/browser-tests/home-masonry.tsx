import { createRoot } from "react-dom/client";
import ColumnGrid from "../src/components/ColumnGrid/ColumnGrid";
import "../src/index.css";

type AcceptanceCard = {
  id: string;
  height: number;
};

const cards: AcceptanceCard[] = [
  { id: "one", height: 118 },
  { id: "two", height: 176 },
  { id: "three", height: 142 },
  { id: "four", height: 204 },
  { id: "five", height: 132 },
];

const params = new URLSearchParams(window.location.search);
const requestedWidth = Number.parseInt(params.get("width") ?? "358", 10);
const testWidth = Number.isFinite(requestedWidth) ? Math.max(240, Math.min(1200, requestedWidth)) : 358;

const App = () => (
  <main className="min-h-screen bg-background p-0 text-foreground">
    <div data-grid-shell style={{ width: `${testWidth}px`, margin: "0 auto" }}>
      <ColumnGrid
        items={cards}
        getKey={(card) => card.id}
        minColumnWidth={168}
        maxColumns={0}
        estimateHeight={(card) => card.height}
        renderItem={(card) => (
          <article
            data-acceptance-card={card.id}
            className="rounded-xl border border-border bg-card p-3"
            style={{ boxSizing: "border-box", height: `${card.height}px` }}
          >
            <strong>{card.id}</strong>
            <p>Representative GoreeCloud Memos card.</p>
          </article>
        )}
      />
    </div>
  </main>
);

createRoot(document.getElementById("root")!).render(<App />);

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const publishGeometry = async () => {
  await nextFrame();
  await nextFrame();
  await new Promise((resolve) => window.setTimeout(resolve, 100));
  await nextFrame();

  const shell = document.querySelector<HTMLElement>("[data-grid-shell]");
  const grid = shell?.firstElementChild as HTMLElement | null;
  const cardElements = Array.from(document.querySelectorAll<HTMLElement>("[data-acceptance-card]"));
  if (!shell || !grid || cardElements.length !== cards.length) {
    document.body.dataset.renderReady = "false";
    document.body.dataset.error = "missing-grid-or-cards";
    return;
  }

  const gridRect = grid.getBoundingClientRect();
  const rects = cardElements.map((element) => element.getBoundingClientRect());
  const columnLefts = Array.from(new Set(rects.map((rect) => Math.round(rect.left - gridRect.left)))).sort((a, b) => a - b);
  const minCardWidth = Math.min(...rects.map((rect) => rect.width));
  const overflow = rects.some((rect) => rect.left < gridRect.left - 0.5 || rect.right > gridRect.right + 0.5);

  document.body.dataset.renderReady = "true";
  document.body.dataset.testWidth = String(testWidth);
  document.body.dataset.columnCount = String(columnLefts.length);
  document.body.dataset.minCardWidth = String(Math.round(minCardWidth));
  document.body.dataset.overflow = String(overflow);
  document.body.dataset.gridHeight = String(Math.round(gridRect.height));

  const diagnostics = document.createElement("pre");
  diagnostics.id = "geometry-diagnostics";
  diagnostics.textContent = JSON.stringify(
    {
      testWidth,
      columnLefts,
      minCardWidth: Math.round(minCardWidth),
      overflow,
      gridHeight: Math.round(gridRect.height),
      cards: rects.map((rect, index) => ({
        id: cards[index].id,
        x: Math.round(rect.left - gridRect.left),
        y: Math.round(rect.top - gridRect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      })),
    },
    null,
    2,
  );
  document.body.append(diagnostics);
};

void publishGeometry();
