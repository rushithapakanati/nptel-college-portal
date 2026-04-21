import { c as createLucideIcon, m as useNavigate, n as useParams, o as useAppContext, r as reactExports, j as jsxRuntimeExports, q as Button, A as ArrowLeft, U as Users, s as motion, C as CircleAlert, t as BookOpen, p as ue, v as Select, w as SelectTrigger, x as SelectValue, y as SelectContent, z as SelectItem, I as Input, E as Eye, L as Label, D as parseFile, H as validateEnrollmentRows, J as validateExamRegRows, K as parseExamRegRecords } from "./index-pRunsA94.js";
import { B as Badge, L as LogOut, C as CircleCheck, T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent, d as Card, f as CardHeader, g as CardTitle, n as CardDescription, e as CardContent, h as Table, i as TableHeader, j as TableRow, k as TableHead, l as TableBody, m as TableCell, D as Dialog, o as DialogContent, p as DialogHeader, q as DialogTitle, X } from "./tabs-D0AoIyrw.js";
import { R as RefreshCw, U as Upload, F as FileText, T as Trash2, C as CirclePlus, a as Funnel, D as Download, S as Save, P as PenLine } from "./upload-Zdx8syIk.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", key: "1oijnt" }],
  ["path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5.5", key: "cereej" }],
  ["path", { d: "M4 13.5V6a2 2 0 0 1 2-2h2", key: "5ua5vh" }],
  [
    "path",
    {
      d: "M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z",
      key: "1y4qbx"
    }
  ]
];
const ClipboardPen = createLucideIcon("clipboard-pen", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
];
const Lock = createLucideIcon("lock", __iconNode);
function downloadErrorsAsExcel(errors, filename) {
  const headers = [
    "Roll No",
    "Email",
    "Course ID",
    "Course Name",
    "Error Type",
    "Description"
  ];
  const rows = errors.map((e) => [
    e.studentId,
    e.email,
    e.courseId,
    e.courseName ?? "",
    e.errorType,
    e.description ?? ""
  ]);
  const csvContent = [headers, ...rows].map(
    (row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(".xlsx", ".csv");
  a.click();
  URL.revokeObjectURL(url);
}
const PAGE_SIZE = 50;
function PaginationBar({
  page,
  total,
  totalItems,
  onChange,
  ocidPrefix
}) {
  if (total <= 1) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
      "Showing ",
      (page - 1) * PAGE_SIZE + 1,
      "–",
      Math.min(page * PAGE_SIZE, totalItems),
      " of ",
      totalItems
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          variant: "outline",
          onClick: () => onChange(Math.max(1, page - 1)),
          disabled: page === 1,
          "data-ocid": `${ocidPrefix}.pagination_prev`,
          children: "Previous"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs px-2 text-muted-foreground", children: [
        "Page ",
        page,
        " / ",
        total
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          variant: "outline",
          onClick: () => onChange(Math.min(total, page + 1)),
          disabled: page === total,
          "data-ocid": `${ocidPrefix}.pagination_next`,
          children: "Next"
        }
      )
    ] })
  ] });
}
function ErrorTable({
  errors,
  page,
  totalPages,
  onPageChange,
  editMode,
  accentColor,
  onView,
  onEdit,
  ocidPrefix,
  bgClass,
  textClass
}) {
  const paged = errors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hdrClass = accentColor === "blue" ? "text-blue-800" : "text-purple-800";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `rounded-lg border overflow-x-auto ${bgClass}`,
        "data-ocid": `${ocidPrefix}.table`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            TableRow,
            {
              className: accentColor === "blue" ? "bg-blue-50/60" : "bg-purple-50/60",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: hdrClass, children: "Roll No" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: hdrClass, children: "Course Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: hdrClass, children: "Course ID" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: hdrClass, children: "Error Type" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: `${hdrClass} w-16`, children: "Details" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: `${hdrClass} w-20`, children: "Edit" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: paged.map((err, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            TableRow,
            {
              "data-ocid": `${ocidPrefix}.row.${i + 1}`,
              className: accentColor === "blue" ? "hover:bg-blue-50/30" : "hover:bg-purple-50/30",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-sm", children: err.studentId }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TableCell,
                  {
                    className: `text-sm font-bold ${textClass} max-w-[200px] truncate`,
                    children: err.courseName || "—"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs text-muted-foreground", children: err.courseId }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs", children: err.errorType }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "sm",
                    variant: "ghost",
                    onClick: () => onView(err),
                    className: `h-7 w-7 p-0 ${accentColor === "blue" ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50" : "text-purple-600 hover:text-purple-800 hover:bg-purple-50"}`,
                    "data-ocid": `${ocidPrefix}.view_button.${i + 1}`,
                    "aria-label": "View error details",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3.5 w-3.5" })
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    onClick: () => onEdit(err),
                    disabled: !editMode,
                    className: "h-7 px-2 gap-1 text-xs",
                    "data-ocid": `${ocidPrefix}.edit_button.${i + 1}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3 w-3" }),
                      " Edit"
                    ]
                  }
                ) })
              ]
            },
            err.id
          )) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PaginationBar,
      {
        page,
        total: totalPages,
        totalItems: errors.length,
        onChange: onPageChange,
        ocidPrefix
      }
    )
  ] });
}
function HODDashboard() {
  var _a, _b, _c, _d;
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const collegeName = params.collegeName ? decodeURIComponent(params.collegeName) : "";
  const branch = params.branch ?? "CSE";
  const {
    hodPermissions,
    updateHodPermission,
    enrollmentErrors,
    updateEnrollmentError,
    appendEnrollmentErrors,
    examRegErrors,
    updateExamRegError,
    appendExamRegErrors,
    deanExamRegDataUploaded,
    deanStudentDataUploaded,
    hodEditedRecords,
    addHodEditedRecord,
    appendHodUploadedRecords,
    hodUploadedRecords,
    uploadedCourses,
    logout
  } = useAppContext();
  const [refreshKey, setRefreshKey] = reactExports.useState(0);
  const permissions = hodPermissions[branch] ?? {
    canUpload: false,
    uploadCredits: 0
  };
  const canUpload = permissions.canUpload;
  const uploadCredits = permissions.uploadCredits;
  const branchEnrollErrors = reactExports.useMemo(
    () => enrollmentErrors.filter((e) => e.branch === branch),
    [enrollmentErrors, branch]
  );
  const branchExamErrors = reactExports.useMemo(
    () => examRegErrors.filter((e) => e.branch === branch),
    [examRegErrors, branch]
  );
  const branchEdits = reactExports.useMemo(
    () => hodEditedRecords.filter((r) => r.branch === branch),
    [hodEditedRecords, branch]
  );
  const hodHasUploaded = hodUploadedRecords.some((r) => r.branch === branch);
  const showEnrollmentErrors = deanStudentDataUploaded || hodHasUploaded;
  const showExamRegErrors = deanExamRegDataUploaded || hodHasUploaded;
  const enrollFileRef = reactExports.useRef(null);
  const examFileRef = reactExports.useRef(null);
  const [enrollFileList, setEnrollFileList] = reactExports.useState([]);
  const [examFileList, setExamFileList] = reactExports.useState([]);
  const [enrollSnapshots, setEnrollSnapshots] = reactExports.useState([]);
  const [examSnapshots, setExamSnapshots] = reactExports.useState([]);
  const [viewEnrollSnapIdx, setViewEnrollSnapIdx] = reactExports.useState(
    null
  );
  const [viewExamSnapIdx, setViewExamSnapIdx] = reactExports.useState(null);
  const [enrollFilter, setEnrollFilter] = reactExports.useState("All");
  const [examFilter, setExamFilter] = reactExports.useState("All");
  const [enrollPage, setEnrollPage] = reactExports.useState(1);
  const [examPage, setExamPage] = reactExports.useState(1);
  const uniqueEnrollTypes = reactExports.useMemo(
    () => Array.from(new Set(branchEnrollErrors.map((e) => e.errorType))),
    [branchEnrollErrors]
  );
  const uniqueExamTypes = reactExports.useMemo(
    () => Array.from(new Set(branchExamErrors.map((e) => e.errorType))),
    [branchExamErrors]
  );
  const filteredEnroll = reactExports.useMemo(
    () => enrollFilter === "All" ? branchEnrollErrors : branchEnrollErrors.filter((e) => e.errorType === enrollFilter),
    [branchEnrollErrors, enrollFilter]
  );
  const filteredExam = reactExports.useMemo(
    () => examFilter === "All" ? branchExamErrors : branchExamErrors.filter((e) => e.errorType === examFilter),
    [branchExamErrors, examFilter]
  );
  const totalEnrollPages = Math.ceil(filteredEnroll.length / PAGE_SIZE);
  const totalExamPages = Math.ceil(filteredExam.length / PAGE_SIZE);
  const [enrollEditMode, setEnrollEditMode] = reactExports.useState(false);
  const [examEditMode, setExamEditMode] = reactExports.useState(false);
  const [viewEnrollErr, setViewEnrollErr] = reactExports.useState(
    null
  );
  const [viewExamErr, setViewExamErr] = reactExports.useState(null);
  const [editEnrollErr, setEditEnrollErr] = reactExports.useState(
    null
  );
  const [editExamErr, setEditExamErr] = reactExports.useState(null);
  const [editEnrollForm, setEditEnrollForm] = reactExports.useState({});
  const [editExamForm, setEditExamForm] = reactExports.useState({});
  const [courseSearch, setCourseSearch] = reactExports.useState("");
  const [coursePage, setCoursePage] = reactExports.useState(1);
  const filteredCourses = reactExports.useMemo(
    () => courseSearch ? uploadedCourses.filter(
      (c) => c.courseName.toLowerCase().includes(courseSearch.toLowerCase()) || c.courseId.toLowerCase().includes(courseSearch.toLowerCase())
    ) : uploadedCourses,
    [uploadedCourses, courseSearch]
  );
  const pagedCourses = filteredCourses.slice(
    (coursePage - 1) * PAGE_SIZE,
    coursePage * PAGE_SIZE
  );
  const totalCoursePages = Math.ceil(filteredCourses.length / PAGE_SIZE);
  const handleEnrollFilterChange = reactExports.useCallback((v) => {
    setEnrollFilter(v);
    setEnrollPage(1);
  }, []);
  const handleExamFilterChange = reactExports.useCallback((v) => {
    setExamFilter(v);
    setExamPage(1);
  }, []);
  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }
  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    ue.success("Dashboard refreshed.");
  }
  async function handleEnrollUpload(e) {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    e.target.value = "";
    if (!canUpload) {
      ue.error("Upload access not granted by Dean.");
      return;
    }
    if (uploadCredits <= 0) {
      ue.error("No upload credits remaining. Ask Dean for more.");
      return;
    }
    updateHodPermission(branch, {
      uploadCredits: Math.max(0, uploadCredits - 1)
    });
    setEnrollFileList((prev) => [...prev, file.name]);
    try {
      ue.info(`Parsing enrollment file "${file.name}"…`);
      const rows = await parseFile(file);
      const courseIds = uploadedCourses.map((c) => c.courseId);
      const { records, errors } = validateEnrollmentRows(
        rows,
        collegeName,
        courseIds,
        uploadedCourses
      );
      appendEnrollmentErrors(errors);
      appendHodUploadedRecords(records);
      setEnrollSnapshots((prev) => [
        ...prev,
        {
          fileName: file.name,
          timestamp: Date.now(),
          recordCount: records.length,
          errors
        }
      ]);
      setViewEnrollSnapIdx(null);
      ue.success(
        `Parsed "${file.name}": ${records.length} records, ${errors.length} errors.`
      );
    } catch (err) {
      ue.error(
        `Parse failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  function handleEnrollDeleteFile(fileName) {
    setEnrollFileList((prev) => prev.filter((n) => n !== fileName));
    ue.info(`File "${fileName}" removed.`);
  }
  async function handleExamUpload(e) {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    e.target.value = "";
    if (!canUpload) {
      ue.error("Upload access not granted by Dean.");
      return;
    }
    if (uploadCredits <= 0) {
      ue.error("No upload credits remaining. Ask Dean for more.");
      return;
    }
    updateHodPermission(branch, {
      uploadCredits: Math.max(0, uploadCredits - 1)
    });
    setExamFileList((prev) => [...prev, file.name]);
    try {
      ue.info(`Parsing exam reg file "${file.name}"…`);
      const rows = await parseFile(file);
      const courseIds = uploadedCourses.map((c) => c.courseId);
      const examErrors = validateExamRegRows(rows, [], courseIds, collegeName);
      const examRecords = parseExamRegRecords(rows);
      appendExamRegErrors(examErrors);
      appendHodUploadedRecords(examRecords);
      setExamSnapshots((prev) => [
        ...prev,
        {
          fileName: file.name,
          timestamp: Date.now(),
          recordCount: examRecords.length,
          errors: examErrors
        }
      ]);
      setViewExamSnapIdx(null);
      ue.success(
        `Parsed "${file.name}": ${examRecords.length} records, ${examErrors.length} errors.`
      );
    } catch (err) {
      ue.error(
        `Parse failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  function handleExamDeleteFile(fileName) {
    setExamFileList((prev) => prev.filter((n) => n !== fileName));
    ue.info(`File "${fileName}" removed.`);
  }
  function saveEditEnroll() {
    if (!editEnrollErr) return;
    const { id, studentId, email, courseId, courseName } = editEnrollErr;
    updateEnrollmentError(id, editEnrollForm);
    addHodEditedRecord({
      id,
      studentId: editEnrollForm.studentId ?? studentId,
      email: editEnrollForm.email ?? email,
      courseId: editEnrollForm.courseId ?? courseId,
      courseName: editEnrollForm.courseName ?? courseName,
      branch,
      editedBy: "HOD",
      editedAt: (/* @__PURE__ */ new Date()).toISOString(),
      oldValues: { studentId, email, courseId, courseName },
      newValues: {
        studentId: editEnrollForm.studentId ?? studentId,
        email: editEnrollForm.email ?? email,
        courseId: editEnrollForm.courseId ?? courseId
      }
    });
    ue.success("Enrollment record updated.");
    setEditEnrollErr(null);
  }
  function saveEditExam() {
    if (!editExamErr) return;
    const { id, studentId, email, courseId, courseName } = editExamErr;
    updateExamRegError(id, editExamForm);
    addHodEditedRecord({
      id,
      studentId: editExamForm.studentId ?? studentId,
      email: editExamForm.email ?? email ?? "",
      courseId: editExamForm.courseId ?? courseId,
      courseName: editExamForm.courseName ?? courseName,
      branch,
      editedBy: "HOD",
      editedAt: (/* @__PURE__ */ new Date()).toISOString(),
      oldValues: { studentId, email: email ?? "", courseId, courseName },
      newValues: {
        studentId: editExamForm.studentId ?? studentId,
        courseId: editExamForm.courseId ?? courseId,
        paymentStatus: editExamForm.paymentStatus ?? ""
      }
    });
    ue.success("Exam registration record updated.");
    setEditExamErr(null);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-card border-b shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 py-3 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => navigate({ to: `/college/${encodeURIComponent(collegeName)}` }),
          className: "gap-2 text-muted-foreground hover:text-foreground",
          "data-ocid": "hod.back.button",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-px bg-border" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5 text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-bold text-foreground", children: "HOD Dashboard" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "ml-0.5", children: branch }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground text-sm hidden sm:block", children: [
        "— ",
        collegeName
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: handleRefresh,
            className: "gap-2",
            "data-ocid": "hod.refresh.button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Refresh" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: handleLogout,
            className: "gap-2 text-destructive hover:text-destructive",
            "data-ocid": "hod.logout.button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Logout" })
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 container mx-auto px-4 py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
        className: "space-y-6",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 flex flex-wrap items-center gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-widest", children: "Institution" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold", children: collegeName })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-8 bg-border hidden sm:block" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-widest", children: "Department" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold", children: branch })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-8 bg-border hidden sm:block" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-widest", children: "Upload Access" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 mt-0.5", children: canUpload ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-green-600" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-green-700 font-medium", children: [
                  uploadCredits,
                  " credit",
                  uploadCredits !== 1 ? "s" : "",
                  " ",
                  "remaining"
                ] })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Locked — request from Dean" })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "upload", className: "w-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-4 mb-6 h-auto p-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "upload",
                  className: "flex items-center gap-1.5 py-2 text-xs sm:text-sm",
                  "data-ocid": "hod.tab.upload",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-3.5 w-3.5" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Upload" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "enrollment",
                  className: "flex items-center gap-1.5 py-2 text-xs sm:text-sm",
                  "data-ocid": "hod.tab.enrollment",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5 text-blue-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Enrollment Errors" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Enroll" }),
                    branchEnrollErrors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-0.5 bg-blue-100 text-blue-800 border-blue-200 text-xs px-1.5 py-0 h-4", children: branchEnrollErrors.length })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "examreg",
                  className: "flex items-center gap-1.5 py-2 text-xs sm:text-sm",
                  "data-ocid": "hod.tab.examreg",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3.5 w-3.5 text-purple-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Exam Reg Errors" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Exam" }),
                    branchExamErrors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-0.5 bg-purple-100 text-purple-800 border-purple-200 text-xs px-1.5 py-0 h-4", children: branchExamErrors.length })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "courses",
                  className: "flex items-center gap-1.5 py-2 text-xs sm:text-sm",
                  "data-ocid": "hod.tab.courses",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-3.5 w-3.5" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "12-Week Courses" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Courses" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "upload", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-base flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4 text-blue-600" }),
                      "Enrollment Data Upload"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: canUpload ? `${uploadCredits} upload credit${uploadCredits !== 1 ? "s" : ""} remaining` : "Upload access not granted by Dean" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: !canUpload ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      "data-ocid": "hod.enrollment_upload.locked",
                      className: "flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-muted bg-muted/30 text-center",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-8 w-8 text-muted-foreground/50" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Upload access not granted by Dean." }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Contact the Dean to enable this feature." })
                      ]
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                    enrollFileList.map((fname) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-green-600 shrink-0" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-green-700 flex-1 truncate", children: fname }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              size: "sm",
                              variant: "ghost",
                              onClick: () => handleEnrollDeleteFile(fname),
                              className: "h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50",
                              "data-ocid": "hod.enrollment.delete_button",
                              title: "Remove file",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                            }
                          )
                        ]
                      },
                      fname
                    )),
                    uploadCredits > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "label",
                        {
                          htmlFor: "enroll-file",
                          "data-ocid": "hod.enrollment.dropzone",
                          className: "flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "h-6 w-6 text-blue-600 shrink-0" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-blue-900", children: enrollFileList.length > 0 ? "Upload another enrollment file" : "Click to upload enrollment CSV/Excel" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-blue-600/80 mt-0.5", children: [
                                uploadCredits,
                                " upload",
                                uploadCredits !== 1 ? "s" : "",
                                " remaining"
                              ] })
                            ] })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          ref: enrollFileRef,
                          id: "enroll-file",
                          type: "file",
                          accept: ".csv,.xlsx,.xls",
                          className: "hidden",
                          onChange: handleEnrollUpload,
                          "data-ocid": "hod.enrollment.upload_button"
                        }
                      ),
                      enrollSnapshots.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 p-3 rounded-lg border bg-muted/30", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground mb-2", children: "Previous Enrollment Files" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => setViewEnrollSnapIdx(null),
                              className: `w-full flex items-center justify-between p-2 rounded text-xs ${viewEnrollSnapIdx === null ? "bg-primary/10 border border-primary/30 font-medium" : "hover:bg-muted/50"}`,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Latest (current)" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Badge,
                                  {
                                    variant: "outline",
                                    className: "text-xs",
                                    children: "Active"
                                  }
                                )
                              ]
                            }
                          ),
                          enrollSnapshots.map((snap, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "div",
                            {
                              className: `flex items-center justify-between p-2 rounded text-xs ${viewEnrollSnapIdx === idx ? "bg-amber-50 border border-amber-300 font-medium" : "hover:bg-muted/50"}`,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                  "button",
                                  {
                                    type: "button",
                                    onClick: () => setViewEnrollSnapIdx(idx),
                                    className: "flex items-center gap-1 flex-1 truncate text-left min-w-0",
                                    children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate flex-1", children: snap.fileName }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground ml-2 shrink-0", children: new Date(
                                        snap.timestamp
                                      ).toLocaleDateString() })
                                    ]
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    size: "sm",
                                    variant: "outline",
                                    className: "h-6 px-2 text-xs ml-2 shrink-0 border-blue-300 text-blue-600 hover:bg-blue-50",
                                    "data-ocid": `hod.enrollment.snapshot_restore.${idx}`,
                                    onClick: () => {
                                      appendEnrollmentErrors(
                                        snap.errors
                                      );
                                      setViewEnrollSnapIdx(null);
                                      ue.success(
                                        `Restored enrollment data from "${snap.fileName}"`
                                      );
                                    },
                                    children: "Restore"
                                  }
                                )
                              ]
                            },
                            snap.timestamp
                          ))
                        ] })
                      ] })
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-amber-600 shrink-0" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700", children: "No upload credits remaining. Ask Dean for more." })
                    ] })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-base flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4 text-purple-600" }),
                      "Exam Registration Upload"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: canUpload ? `${uploadCredits} upload credit${uploadCredits !== 1 ? "s" : ""} remaining` : "Upload access not granted by Dean" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: !canUpload ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      "data-ocid": "hod.exam_reg_upload.locked",
                      className: "flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-muted bg-muted/30 text-center",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-8 w-8 text-muted-foreground/50" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Upload access not granted by Dean." }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Contact the Dean to enable this feature." })
                      ]
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                    examFileList.map((fname) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-green-600 shrink-0" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-green-700 flex-1 truncate", children: fname }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Button,
                            {
                              size: "sm",
                              variant: "ghost",
                              onClick: () => handleExamDeleteFile(fname),
                              className: "h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50",
                              "data-ocid": "hod.exam_reg.delete_button",
                              title: "Remove file",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" })
                            }
                          )
                        ]
                      },
                      fname
                    )),
                    uploadCredits > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "label",
                        {
                          htmlFor: "exam-file",
                          "data-ocid": "hod.exam_reg.dropzone",
                          className: "flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50/50 cursor-pointer hover:bg-purple-50 transition-colors",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "h-6 w-6 text-purple-600 shrink-0" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-purple-900", children: examFileList.length > 0 ? "Upload another exam reg file" : "Click to upload exam reg CSV/Excel" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-purple-600/80 mt-0.5", children: [
                                uploadCredits,
                                " upload",
                                uploadCredits !== 1 ? "s" : "",
                                " remaining"
                              ] })
                            ] })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          ref: examFileRef,
                          id: "exam-file",
                          type: "file",
                          accept: ".csv,.xlsx,.xls",
                          className: "hidden",
                          onChange: handleExamUpload,
                          "data-ocid": "hod.exam_reg.upload_button"
                        }
                      ),
                      examSnapshots.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 p-3 rounded-lg border bg-muted/30", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground mb-2", children: "Previous Exam Reg Files" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => setViewExamSnapIdx(null),
                              className: `w-full flex items-center justify-between p-2 rounded text-xs ${viewExamSnapIdx === null ? "bg-primary/10 border border-primary/30 font-medium" : "hover:bg-muted/50"}`,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Latest (current)" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Badge,
                                  {
                                    variant: "outline",
                                    className: "text-xs",
                                    children: "Active"
                                  }
                                )
                              ]
                            }
                          ),
                          examSnapshots.map((snap, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "div",
                            {
                              className: `flex items-center justify-between p-2 rounded text-xs ${viewExamSnapIdx === idx ? "bg-amber-50 border border-amber-300 font-medium" : "hover:bg-muted/50"}`,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                  "button",
                                  {
                                    type: "button",
                                    onClick: () => setViewExamSnapIdx(idx),
                                    className: "flex items-center gap-1 flex-1 truncate text-left min-w-0",
                                    children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate flex-1", children: snap.fileName }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground ml-2 shrink-0", children: new Date(
                                        snap.timestamp
                                      ).toLocaleDateString() })
                                    ]
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    size: "sm",
                                    variant: "outline",
                                    className: "h-6 px-2 text-xs ml-2 shrink-0 border-purple-300 text-purple-600 hover:bg-purple-50",
                                    "data-ocid": `hod.exam_reg.snapshot_restore.${idx}`,
                                    onClick: () => {
                                      appendExamRegErrors(
                                        snap.errors
                                      );
                                      setViewExamSnapIdx(null);
                                      ue.success(
                                        `Restored exam reg data from "${snap.fileName}"`
                                      );
                                    },
                                    children: "Restore"
                                  }
                                )
                              ]
                            },
                            snap.timestamp
                          ))
                        ] })
                      ] })
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-amber-600 shrink-0" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700", children: "No upload credits remaining. Ask Dean for more." })
                    ] })
                  ] }) })
                ] })
              ] }),
              viewEnrollSnapIdx !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 shrink-0" }),
                "Viewing historical enrollment data from",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: (_a = enrollSnapshots[viewEnrollSnapIdx]) == null ? void 0 : _a.fileName }),
                " ",
                "(uploaded",
                " ",
                new Date(
                  (_b = enrollSnapshots[viewEnrollSnapIdx]) == null ? void 0 : _b.timestamp
                ).toLocaleString(),
                ").",
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setViewEnrollSnapIdx(null),
                    className: "ml-auto underline text-amber-700",
                    children: "View Latest"
                  }
                )
              ] }),
              viewExamSnapIdx !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 shrink-0" }),
                "Viewing historical exam reg data from",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: (_c = examSnapshots[viewExamSnapIdx]) == null ? void 0 : _c.fileName }),
                " ",
                "(uploaded",
                " ",
                new Date(
                  (_d = examSnapshots[viewExamSnapIdx]) == null ? void 0 : _d.timestamp
                ).toLocaleString(),
                ").",
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setViewExamSnapIdx(null),
                    className: "ml-auto underline text-amber-700",
                    children: "View Latest"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "enrollment", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-blue-200", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-blue-50/60 rounded-t-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-base flex items-center gap-2 text-blue-900", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-blue-600" }),
                  "Enrollment Errors — ",
                  branch,
                  showEnrollmentErrors && branchEnrollErrors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-blue-600 text-white ml-1", children: [
                    filteredEnroll.length,
                    enrollFilter !== "All" && ` / ${branchEnrollErrors.length}`
                  ] })
                ] }),
                showEnrollmentErrors && branchEnrollErrors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-4 w-4 text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      value: enrollFilter,
                      onValueChange: handleEnrollFilterChange,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SelectTrigger,
                          {
                            className: "w-44 h-8 text-xs",
                            "data-ocid": "hod.enrollment_errors.type.select",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: "All Error Types" }),
                          uniqueEnrollTypes.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t, children: t }, t))
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      size: "sm",
                      variant: "outline",
                      className: "h-8 gap-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-50",
                      "data-ocid": "hod.enrollment_errors.download_button",
                      onClick: () => downloadErrorsAsExcel(
                        filteredEnroll,
                        `enrollment-errors-${branch}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`
                      ),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3 w-3" }),
                        " Download"
                      ]
                    }
                  ),
                  enrollEditMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      size: "sm",
                      variant: "destructive",
                      className: "h-8 gap-1 text-xs",
                      "data-ocid": "hod.enrollment_errors.end_editing_button",
                      onClick: () => {
                        updateHodPermission(branch, {
                          uploadCredits: Math.max(0, uploadCredits - 1)
                        });
                        setEnrollEditMode(false);
                        ue.success(
                          "Edit session ended. 1 credit used."
                        );
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3" }),
                        " End Editing / Save All"
                      ]
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      size: "sm",
                      variant: "outline",
                      className: "h-8 gap-1 text-xs",
                      "data-ocid": "hod.enrollment_errors.enable_editing_button",
                      disabled: uploadCredits <= 0,
                      title: uploadCredits <= 0 ? "No edit credits. Ask Dean for more." : "Enable editing for all rows",
                      onClick: () => setEnrollEditMode(true),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3 w-3" }),
                        " Enable Editing"
                      ]
                    }
                  )
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-4", children: [
                !showEnrollmentErrors ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "hod.enrollment_errors.empty_state",
                    className: "flex flex-col items-center gap-3 py-12 text-center text-muted-foreground",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-10 w-10 text-muted-foreground/40" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No Student Data Uploaded" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm max-w-sm", children: "Upload an enrollment file or wait for the Dean to upload data." })
                    ]
                  }
                ) : branchEnrollErrors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "hod.enrollment_errors.empty_state",
                    className: "text-center py-12 text-muted-foreground",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 mx-auto mb-2 text-green-500" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-green-700", children: [
                        "No enrollment errors for ",
                        branch,
                        " branch."
                      ] })
                    ]
                  }
                ) : filteredEnroll.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    "data-ocid": "hod.enrollment_errors.empty_state",
                    className: "text-center py-8 text-muted-foreground",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No errors match the selected filter." })
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ErrorTable,
                    {
                      errors: filteredEnroll,
                      page: enrollPage,
                      totalPages: totalEnrollPages,
                      onPageChange: setEnrollPage,
                      editMode: enrollEditMode,
                      accentColor: "blue",
                      bgClass: "border-blue-100",
                      textClass: "text-blue-800",
                      onView: (err) => setViewEnrollErr(err),
                      onEdit: (err) => {
                        setEditEnrollErr(err);
                        setEditEnrollForm({
                          studentId: err.studentId,
                          email: err.email,
                          courseId: err.courseId,
                          courseName: err.courseName
                        });
                      },
                      ocidPrefix: "hod.enrollment_errors"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [
                    "Edit credits remaining: ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: uploadCredits })
                  ] })
                ] }),
                branchEdits.filter(
                  (r) => r.newValues.paymentStatus === void 0
                ).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "flex items-center gap-2 font-display font-semibold text-sm mb-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardPen, { className: "h-4 w-4 text-indigo-600" }),
                    "Edited Enrollment Records",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-indigo-100 text-indigo-800 border-indigo-200", children: branchEdits.length })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "rounded-lg border overflow-x-auto",
                      "data-ocid": "hod.edited_records.table",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "bg-indigo-50/60", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "#" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Roll No" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Course Name" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Course ID" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Edited At" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Old Values" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "New Values" })
                        ] }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: branchEdits.map((rec, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          TableRow,
                          {
                            "data-ocid": `hod.edited_records.row.${i + 1}`,
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground text-xs", children: i + 1 }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-sm", children: rec.studentId }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-sm max-w-[160px] truncate", children: rec.courseName }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs", children: rec.courseId }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground whitespace-nowrap", children: new Date(rec.editedAt).toLocaleString(
                                "en-IN"
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground max-w-[140px] truncate", children: Object.entries(rec.oldValues).map(([k, v]) => `${k}: ${v}`).join(", ") }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs max-w-[140px] truncate", children: Object.entries(rec.newValues).map(([k, v]) => `${k}: ${v}`).join(", ") })
                            ]
                          },
                          `${rec.id}-${i}`
                        )) })
                      ] })
                    }
                  )
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "examreg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-purple-200", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-purple-50/60 rounded-t-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-base flex items-center gap-2 text-purple-900", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-purple-600" }),
                  "Exam Registration Errors — ",
                  branch,
                  showExamRegErrors && branchExamErrors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-purple-600 text-white ml-1", children: [
                    filteredExam.length,
                    examFilter !== "All" && ` / ${branchExamErrors.length}`
                  ] })
                ] }),
                showExamRegErrors && branchExamErrors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "h-4 w-4 text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      value: examFilter,
                      onValueChange: handleExamFilterChange,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SelectTrigger,
                          {
                            className: "w-44 h-8 text-xs",
                            "data-ocid": "hod.exam_reg_errors.type.select",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: "All Error Types" }),
                          uniqueExamTypes.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t, children: t }, t))
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      size: "sm",
                      variant: "outline",
                      className: "h-8 gap-1 text-xs border-purple-300 text-purple-700 hover:bg-purple-50",
                      "data-ocid": "hod.exam_reg_errors.download_button",
                      onClick: () => downloadErrorsAsExcel(
                        filteredExam,
                        `examreg-errors-${branch}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`
                      ),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3 w-3" }),
                        " Download"
                      ]
                    }
                  ),
                  examEditMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      size: "sm",
                      variant: "destructive",
                      className: "h-8 gap-1 text-xs",
                      "data-ocid": "hod.exam_reg_errors.end_editing_button",
                      onClick: () => {
                        updateHodPermission(branch, {
                          uploadCredits: Math.max(0, uploadCredits - 1)
                        });
                        setExamEditMode(false);
                        ue.success(
                          "Edit session ended. 1 credit used."
                        );
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3" }),
                        " End Editing / Save All"
                      ]
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      size: "sm",
                      variant: "outline",
                      className: "h-8 gap-1 text-xs",
                      "data-ocid": "hod.exam_reg_errors.enable_editing_button",
                      disabled: uploadCredits <= 0,
                      title: uploadCredits <= 0 ? "No edit credits. Ask Dean for more." : "Enable editing for all rows",
                      onClick: () => setExamEditMode(true),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-3 w-3" }),
                        " Enable Editing"
                      ]
                    }
                  )
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-4", children: !showExamRegErrors ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "hod.exam_reg_errors.empty_state",
                  className: "flex flex-col items-center gap-3 py-12 text-center text-muted-foreground",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-10 w-10 text-muted-foreground/40" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No Exam Registration Data Uploaded" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm max-w-sm", children: "Upload an exam reg file or wait for the Dean to upload data." })
                  ]
                }
              ) : branchExamErrors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "hod.exam_reg_errors.empty_state",
                  className: "text-center py-12 text-muted-foreground",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 mx-auto mb-2 text-green-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-green-700", children: [
                      "No exam registration errors for ",
                      branch,
                      " branch."
                    ] })
                  ]
                }
              ) : filteredExam.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  "data-ocid": "hod.exam_reg_errors.empty_state",
                  className: "text-center py-8 text-muted-foreground",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No errors match the selected filter." })
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ErrorTable,
                  {
                    errors: filteredExam,
                    page: examPage,
                    totalPages: totalExamPages,
                    onPageChange: setExamPage,
                    editMode: examEditMode,
                    accentColor: "purple",
                    bgClass: "border-purple-100",
                    textClass: "text-purple-800",
                    onView: (err) => setViewExamErr(err),
                    onEdit: (err) => {
                      setEditExamErr(err);
                      setEditExamForm({
                        studentId: err.studentId,
                        courseId: err.courseId,
                        paymentStatus: err.paymentStatus
                      });
                    },
                    ocidPrefix: "hod.exam_reg_errors"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [
                  "Edit credits remaining: ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: uploadCredits })
                ] })
              ] }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "courses", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-base flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-4 w-4 text-primary" }),
                    "12-Week NPTEL Courses",
                    uploadedCourses.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
                      uploadedCourses.length,
                      " courses"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-1", children: "All 12-week courses uploaded by Dean — visible to all HODs without branch filtering" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    placeholder: "Search by Course Name or ID…",
                    value: courseSearch,
                    onChange: (e) => {
                      setCourseSearch(e.target.value);
                      setCoursePage(1);
                    },
                    className: "w-64 h-8 text-sm",
                    "data-ocid": "hod.courses.search_input"
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: uploadedCourses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "hod.courses.empty_state",
                  className: "flex flex-col items-center gap-3 py-12 text-center text-muted-foreground",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-10 w-10 text-muted-foreground/40" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No 12-Week Courses Available" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm max-w-sm", children: "Dean has not uploaded the 12-week courses file yet." })
                  ]
                }
              ) : filteredCourses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  "data-ocid": "hod.courses.empty_state",
                  className: "text-center py-8 text-muted-foreground",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "No courses match your search." })
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "rounded-lg border overflow-x-auto",
                    "data-ocid": "hod.courses.table",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "bg-muted/50", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-10", children: "#" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Course ID" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Course Name" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Duration" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Week Count" })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: pagedCourses.map((course, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        TableRow,
                        {
                          "data-ocid": `hod.courses.row.${(coursePage - 1) * PAGE_SIZE + i + 1}`,
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground text-xs", children: (coursePage - 1) * PAGE_SIZE + i + 1 }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-xs", children: course.courseId }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-medium text-sm", children: course.courseName }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: course.duration }) }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              Badge,
                              {
                                variant: "secondary",
                                className: "text-xs",
                                children: [
                                  course.weekCount,
                                  " wks"
                                ]
                              }
                            ) })
                          ]
                        },
                        course.courseId
                      )) })
                    ] })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  PaginationBar,
                  {
                    page: coursePage,
                    total: totalCoursePages,
                    totalItems: filteredCourses.length,
                    onChange: setCoursePage,
                    ocidPrefix: "hod.courses"
                  }
                )
              ] }) })
            ] }) })
          ] })
        ]
      }
    ) }),
    viewEnrollErr && /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: true, onOpenChange: () => setViewEnrollErr(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DialogContent,
      {
        className: "max-w-md",
        "data-ocid": "hod.view_enroll_error.dialog",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 text-blue-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }),
            "Enrollment Error Details"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg bg-blue-50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "Course" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-base text-blue-800 mt-1", children: viewEnrollErr.courseName || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-xs text-muted-foreground mt-0.5", children: viewEnrollErr.courseId })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Error Type:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs", children: viewEnrollErr.errorType })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Description: " }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: viewEnrollErr.description })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-3 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Roll No: " }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: viewEnrollErr.studentId })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Email: " }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: viewEnrollErr.email })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Branch: " }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: viewEnrollErr.branch })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => setViewEnrollErr(null),
              className: "mt-2",
              "data-ocid": "hod.view_enroll_error.close_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3 mr-1" }),
                " Close"
              ]
            }
          )
        ]
      }
    ) }),
    viewExamErr && /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: true, onOpenChange: () => setViewExamErr(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DialogContent,
      {
        className: "max-w-md",
        "data-ocid": "hod.view_exam_error.dialog",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 text-purple-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }),
            "Exam Registration Error Details"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg bg-purple-50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-wide", children: "Course" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-base text-purple-800 mt-1", children: viewExamErr.courseName || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-xs text-muted-foreground mt-0.5", children: viewExamErr.courseId })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Error Type:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-purple-100 text-purple-800 border-purple-200 text-xs", children: viewExamErr.errorType })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Description: " }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: viewExamErr.description })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-3 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Roll No: " }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: viewExamErr.studentId })
              ] }),
              viewExamErr.email && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Email: " }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: viewExamErr.email })
              ] }),
              viewExamErr.paymentStatus && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Payment Status: " }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: viewExamErr.paymentStatus })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => setViewExamErr(null),
              className: "mt-2",
              "data-ocid": "hod.view_exam_error.close_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3 mr-1" }),
                " Close"
              ]
            }
          )
        ]
      }
    ) }),
    editEnrollErr && /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: true, onOpenChange: () => setEditEnrollErr(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DialogContent,
      {
        className: "max-w-lg",
        "data-ocid": "hod.edit_enroll.dialog",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 text-blue-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-4 w-4" }),
            "Edit Enrollment Record"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg bg-blue-50/60 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Course" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-blue-800", children: editEnrollErr.courseName || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-xs text-muted-foreground", children: editEnrollErr.courseId })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Roll No" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: editEnrollForm.studentId ?? "",
                    onChange: (e) => setEditEnrollForm((p) => ({
                      ...p,
                      studentId: e.target.value
                    })),
                    className: "h-8 text-sm mt-1",
                    "data-ocid": "hod.enrollment_edit.studentid.input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Email" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: editEnrollForm.email ?? "",
                    onChange: (e) => setEditEnrollForm((p) => ({
                      ...p,
                      email: e.target.value
                    })),
                    className: "h-8 text-sm mt-1",
                    "data-ocid": "hod.enrollment_edit.email.input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Course ID" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: editEnrollForm.courseId ?? "",
                    onChange: (e) => setEditEnrollForm((p) => ({
                      ...p,
                      courseId: e.target.value
                    })),
                    className: "h-8 text-sm mt-1",
                    "data-ocid": "hod.enrollment_edit.courseid.input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Branch" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: editEnrollErr.branch,
                    disabled: true,
                    className: "h-8 text-sm mt-1 bg-muted"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Error Type" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: editEnrollErr.errorType,
                    disabled: true,
                    className: "h-8 text-sm mt-1 bg-muted"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => setEditEnrollErr(null),
                  "data-ocid": "hod.enrollment_edit.cancel_button",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3 mr-1" }),
                    " Cancel"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  size: "sm",
                  variant: "default",
                  onClick: saveEditEnroll,
                  "data-ocid": "hod.enrollment_edit.save_button",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3 mr-1" }),
                    " Save"
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    ) }),
    editExamErr && /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: true, onOpenChange: () => setEditExamErr(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg", "data-ocid": "hod.edit_exam.dialog", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 text-purple-800", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { className: "h-4 w-4" }),
        "Edit Exam Registration Record"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg bg-purple-50/60 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Course" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-purple-800", children: editExamErr.courseName || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-xs text-muted-foreground", children: editExamErr.courseId })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Roll No" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: editExamForm.studentId ?? "",
                onChange: (e) => setEditExamForm((p) => ({
                  ...p,
                  studentId: e.target.value
                })),
                className: "h-8 text-sm mt-1",
                "data-ocid": "hod.exam_edit.studentid.input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: editExamErr.email ?? "—",
                disabled: true,
                className: "h-8 text-sm mt-1 bg-muted"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Course ID" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: editExamForm.courseId ?? "",
                onChange: (e) => setEditExamForm((p) => ({
                  ...p,
                  courseId: e.target.value
                })),
                className: "h-8 text-sm mt-1",
                "data-ocid": "hod.exam_edit.courseid.input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Payment Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: editExamForm.paymentStatus ?? "",
                onChange: (e) => setEditExamForm((p) => ({
                  ...p,
                  paymentStatus: e.target.value
                })),
                className: "h-8 text-sm mt-1",
                "data-ocid": "hod.exam_edit.payment.input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold", children: "Error Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: editExamErr.errorType,
                disabled: true,
                className: "h-8 text-sm mt-1 bg-muted"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              variant: "ghost",
              onClick: () => setEditExamErr(null),
              "data-ocid": "hod.exam_edit.cancel_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3 mr-1" }),
                " Cancel"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              variant: "default",
              onClick: saveEditExam,
              "data-ocid": "hod.exam_edit.save_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3 w-3 mr-1" }),
                " Save"
              ]
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  HODDashboard as default
};
