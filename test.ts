import { Plugin } from "obsidian";
import {
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  EditorView,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

class TestWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.textContent = "↵";
    span.style.color = "red";
    return span;
  }
  eq(other: WidgetType) {
    return other instanceof TestWidget;
  }
}

export default class SoftBreakPlugin extends Plugin {
  onload() {
    this.registerEditorExtension(
      ViewPlugin.fromClass(
        class {
          decorations: DecorationSet;

          constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
          }

          update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
              this.decorations = this.buildDecorations(update.view);
            }
          }

          buildDecorations(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>();

            for (const { from, to } of view.visibleRanges) {
              const line = view.state.doc.lineAt(from);
              builder.add(
                line.to,
                line.to,
                Decoration.widget({ widget: new TestWidget(), side: 1 })
              );
            }

            return builder.finish();
          }
        },
        {
          decorations: (v) => v.decorations,
        }
      )
    );
  }
}
