'use strict';

var obsidian = require('obsidian');
var view = require('@codemirror/view');
var state = require('@codemirror/state');

class SoftBreakWidget extends view.WidgetType {
    toDOM(view) {
        return this.render();
    }
    render() {
        const span = document.createElement("span");
        span.textContent = "⚠";
        span.style.color = "orange";
        span.style.opacity = "0.7";
        span.style.fontSize = "80%";
        span.style.paddingLeft = "0.2em";
        span.title = "Non-markdown line break (no double space)";
        return span;
    }
}
class SoftBreakPlugin extends obsidian.Plugin {
    async onload() {
        this.registerEditorExtension(view.ViewPlugin.fromClass(class {
            constructor(view) {
                this.decorations = this.buildDecorations(view);
            }
            update(update) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }
            buildDecorations(view$1) {
                const builder = new state.RangeSetBuilder();
                const doc = view$1.state.doc;
                for (let { from, to } of view$1.visibleRanges) {
                    // 可視範囲の全ての行をチェック
                    for (let pos = from; pos < to;) {
                        const line = doc.lineAt(pos);
                        // 最後の行でない場合のみチェック
                        if (line.to < doc.length) {
                            const lineText = doc.sliceString(line.from, line.to);
                            const trimmedLine = lineText.trim();
                            // 除外条件: 空行、markdown的改行（スペース2つ）、特定のMarkdown要素
                            if (trimmedLine.length === 0 ||
                                lineText.endsWith("  ") ||
                                this.isExcludedMarkdownElement(trimmedLine)) ;
                            else {
                                // markdown的改行以外の改行を強調表示
                                const deco = view.Decoration.widget({
                                    widget: new SoftBreakWidget(),
                                    side: 1
                                });
                                builder.add(line.to, line.to, deco);
                            }
                        }
                        pos = line.to + 1;
                    }
                }
                return builder.finish();
            }
            isExcludedMarkdownElement(lineText) {
                // ヘッダー要素 (# ## ### #### ##### ######)
                if (/^#{1,6}\s/.test(lineText)) {
                    return true;
                }
                // リスト要素 (- * + または数字.)
                if (/^[\s]*[-*+]\s/.test(lineText) || /^[\s]*\d+\.\s/.test(lineText)) {
                    return true;
                }
                // 引用ブロック (>)
                if (/^[\s]*>\s/.test(lineText)) {
                    return true;
                }
                // コードブロック (```)
                if (/^[\s]*```/.test(lineText)) {
                    return true;
                }
                // 水平線 (--- *** ___)
                if (/^[\s]*(-{3,}|\*{3,}|_{3,})[\s]*$/.test(lineText)) {
                    return true;
                }
                // テーブル行 (|で区切られた行)
                if (/\|.*\|/.test(lineText)) {
                    return true;
                }
                return false;
            }
        }, {
            decorations: v => v.decorations
        }));
    }
}

module.exports = SoftBreakPlugin;
//# sourceMappingURL=main.js.map
