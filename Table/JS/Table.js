const exportButton = document.querySelector(".export-btn");
const table = document.getElementById("team-table");

/* Verifica se os elementos existem */
if (!exportButton || !table) {
    console.error("Botão de exportação ou tabela não encontrados.");
}

/* UTILS */
function textify(cell) {
    return cell?.textContent.replace(/\s+/g, " ").trim() || "";
}

function csvEscape(value) {
    const v = String(value).replace(/"/g, '""');
    return `"${v}"`;
}

/* EXPORT CSV */
function exportTableToCSV(tableElement, filename = "competitors.csv") {
    if (!tableElement?.tHead || !tableElement?.tBodies.length) {
        console.error("Tabela inválida para exportação.");
        return;
    }

    const headers = Array.from(tableElement.tHead.rows[0].cells)
        .map((th) => csvEscape(textify(th)))
        .join(",");

    const rows = Array.from(tableElement.tBodies[0].rows).map((tr) =>
        Array.from(tr.cells)
            .map((td) => csvEscape(textify(td)))
            .join(",")
    );

    const csv = "\uFEFF" + [headers, ...rows].join("\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

if (exportButton && table) {
    exportButton.addEventListener("click", () => {
        exportTableToCSV(table);
    });
}

/* SORTING */
let currentSortColumn = null;
let currentSortDirection = "asc";

function sortTableByColumn(columnIndex) {
    const tbody = table?.tBodies[0];

    if (!tbody) return;

    const rows = Array.from(tbody.rows);

    const direction =
        currentSortColumn === columnIndex &&
        currentSortDirection === "asc"
            ? "desc"
            : "asc";

    rows.sort((a, b) => {
        const A = textify(a.cells[columnIndex]);
        const B = textify(b.cells[columnIndex]);

        const numA = parseFloat(A.replace(/[^0-9.-]/g, ""));
        const numB = parseFloat(B.replace(/[^0-9.-]/g, ""));

        /* Ordenação numérica */
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            return direction === "asc"
                ? numA - numB
                : numB - numA;
        }

        /* Ordenação textual */
        return direction === "asc"
            ? A.localeCompare(B, "pt-BR", {
            numeric: true,
            sensitivity: "base",
            })
            : B.localeCompare(A, "pt-BR", {
              numeric: true,
              sensitivity: "base",
            });
    });

    rows.forEach((row) => tbody.appendChild(row));

    document.querySelectorAll("th").forEach((th) => {
        th.classList.remove("sorted-asc", "sorted-desc");
    });

    table.tHead.rows[0].cells[columnIndex].classList.add(
        direction === "asc" ? "sorted-asc" : "sorted-desc"
    );

    currentSortColumn = columnIndex;
    currentSortDirection = direction;
}

document.querySelectorAll("th.sortable").forEach((th, index) => {
    th.addEventListener("click", () => {
        sortTableByColumn(index);
    });
});

/* COLUMN RESIZE */
document.querySelectorAll("th.resizable").forEach((th) => {
    const resizer = document.createElement("div");

    Object.assign(resizer.style, {
        width: "6px",
        height: "100%",
        position: "absolute",
        right: "0",
        top: "0",
        cursor: "col-resize",
        userSelect: "none",
    });

    th.style.position = "relative";
    th.appendChild(resizer);

    let startX = 0;
    let startWidth = 0;

    function onMouseMove(e) {
        const newWidth = startWidth + (e.pageX - startX);

        /* Evita largura muito pequena */
        if (newWidth > 50) {
            th.style.width = `${newWidth}px`;
        }
    }

    function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    resizer.addEventListener("mousedown", (e) => {
        e.preventDefault();

        startX = e.pageX;
        startWidth = th.offsetWidth;

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });
});