function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\">$1</a>");
}

function renderTable(lines, startIndex) {
  const rows = [];
  let index = startIndex;

  while (index < lines.length && /^\|.*\|$/.test(lines[index].trim())) {
    rows.push(lines[index].trim());
    index += 1;
  }

  const htmlRows = rows
    .filter((row, rowIndex) => rowIndex !== 1 || !/^\|[\s:\-|]+\|$/.test(row))
    .map((row, rowIndex) => {
      const cells = row.slice(1, -1).split("|").map(cell => inlineMarkdown(cell.trim()));
      const tag = rowIndex === 0 ? "th" : "td";
      return `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join("")}</tr>`;
    })
    .join("");

  return {
    html: `<table><tbody>${htmlRows}</tbody></table>`,
    nextIndex: index
  };
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output = [];
  let paragraph = [];
  let unorderedList = [];
  let orderedList = [];
  let inCode = false;
  let codeLines = [];

  function flushParagraph() {
    if (paragraph.length) {
      output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function flushUnorderedList() {
    if (unorderedList.length) {
      output.push(`<ul>${unorderedList.map(item => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      unorderedList = [];
    }
  }

  function flushOrderedList() {
    if (orderedList.length) {
      output.push(`<ol>${orderedList.map(item => `<li>${inlineMarkdown(item)}</li>`).join("")}</ol>`);
      orderedList = [];
    }
  }

  function flushLists() {
    flushUnorderedList();
    flushOrderedList();
  }

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (line.startsWith("```")) {
      if (inCode) {
        output.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        flushParagraph();
        flushLists();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line) {
      flushParagraph();
      flushLists();
      continue;
    }

    if (/^\|.*\|$/.test(line) && index + 1 < lines.length && /^\|[\s:\-|]+\|$/.test(lines[index + 1].trim())) {
      flushParagraph();
      flushLists();
      const table = renderTable(lines, index);
      output.push(table.html);
      index = table.nextIndex - 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushLists();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (line === "---") {
      flushParagraph();
      flushLists();
      output.push("<hr />");
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushLists();
      output.push(`<blockquote><p>${inlineMarkdown(line.slice(2))}</p></blockquote>`);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      flushOrderedList();
      unorderedList.push(line.slice(2));
      continue;
    }

    const orderedItem = line.match(/^\d+\.\s+(.*)$/);
    if (orderedItem) {
      flushParagraph();
      flushUnorderedList();
      orderedList.push(orderedItem[1]);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushLists();
  return output.join("\n");
}

const content = document.getElementById("documentContent");

if (content) {
  const markdownFile = content.dataset.markdownFile;
  const fallbackFile = content.dataset.fallbackFile || markdownFile;

  fetch(markdownFile)
    .then(response => {
      if (!response.ok) {
        throw new Error("Unable to load Markdown file.");
      }
      return response.text();
    })
    .then(markdown => {
      content.classList.remove("loading");
      content.innerHTML = renderMarkdown(markdown);
    })
    .catch(() => {
      content.innerHTML = `Unable to load the Markdown article. Please use the <a href="${fallbackFile}">Markdown version</a>.`;
    });
}
