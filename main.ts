import { Plugin } from "obsidian";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { StateField, RangeSetBuilder } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

class SoftBreakWidget extends WidgetType {
  toDOM(view: EditorView): HTMLElement {
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

export default class SoftBreakPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension(
			ViewPlugin.fromClass(
				class {
					decorations: DecorationSet;

					constructor(view: any) {
						this.decorations = this.buildDecorations(view);
					}

					update(update: ViewUpdate) {
						if (update.docChanged || update.viewportChanged) {
							this.decorations = this.buildDecorations(update.view);
						}
					}

					buildDecorations(view: any): DecorationSet {
						const builder = new RangeSetBuilder<Decoration>();
						const doc = view.state.doc;

						// 全体をスキャンしてコードブロックの範囲を特定
						const codeBlockRanges: {start: number, end: number}[] = [];
						let currentStart = -1;
						
						for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
							const line = doc.line(lineNum);
							const lineText = doc.sliceString(line.from, line.to);
							const trimmedLine = lineText.trim();
							
							if (/^[\s]*```/.test(trimmedLine)) {
								if (currentStart === -1) {
									// コードブロック開始
									currentStart = line.from;
								} else {
									// コードブロック終了
									codeBlockRanges.push({start: currentStart, end: line.to});
									currentStart = -1;
								}
							}
						}

						for (let { from, to } of view.visibleRanges) {
							// 可視範囲の全ての行をチェック
							for (let pos = from; pos < to;) {
								const line = doc.lineAt(pos);
								
								// 最後の行でない場合のみチェック
								if (line.to < doc.length) {
									const lineText = doc.sliceString(line.from, line.to);
									const trimmedLine = lineText.trim();
									
									// この行がコードブロック内にあるかチェック
									const inCodeBlock = codeBlockRanges.some(range => 
										line.from >= range.start && line.to <= range.end
									);
									
									// 除外条件: 空行、markdown的改行（スペース2つ）、特定のMarkdown要素、コードブロック内
									if (trimmedLine.length === 0 || 
										lineText.endsWith("  ") ||
										inCodeBlock ||
										this.isExcludedMarkdownElement(trimmedLine)) {
										// 除外対象なので何もしない
									} else {
										// markdown的改行以外の改行を強調表示
										const deco = Decoration.widget({
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

					isExcludedMarkdownElement(lineText: string): boolean {
						// ヘッダー要素 (# ## ### #### ##### ######)
						if (/^#{1,6}\s/.test(lineText)) {
							return true;
						}
						
						// リスト要素 (- * + または数字.) - 文字があってもなくても除外
						if (/^[\s]*[-*+](\s|$)/.test(lineText) || /^[\s]*\d+\.(\s|$)/.test(lineText)) {
							return true;
						}
						
						// 引用ブロック (>)
						if (/^[\s]*>/.test(lineText)) {
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
				},
				{
					decorations: v => v.decorations
				}
			)
		);
	}
}
