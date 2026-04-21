import { c as createLucideIcon, m as useNavigate, n as useParams, o as useAppContext, r as reactExports, j as jsxRuntimeExports, q as Button, A as ArrowLeft, O as GraduationCap, s as motion, t as BookOpen, Q as KeyRound, C as CircleAlert, T as loadStudentPassword, V as saveStudentPassword, p as ue, W as normalizePaymentStatus, X as MapPin, L as Label, I as Input, Y as EyeOff, E as Eye } from "./index-pRunsA94.js";
import { L as LogOut, B as Badge, T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent, d as Card, f as CardHeader, g as CardTitle, e as CardContent, C as CircleCheck, D as Dialog, o as DialogContent, p as DialogHeader, q as DialogTitle, h as Table, i as TableHeader, j as TableRow, k as TableHead, l as TableBody, m as TableCell } from "./tabs-D0AoIyrw.js";
import { C as ClipboardCheck, S as Shuffle, a as CircleX } from "./shuffle-DyD_8WIA.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
];
const Calendar = createLucideIcon("calendar", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "m14.5 12.5-5 5", key: "b62r18" }],
  ["path", { d: "m9.5 12.5 5 5", key: "1rk7el" }]
];
const FileX = createLucideIcon("file-x", __iconNode);
const ErrorPopup = reactExports.memo(function ErrorPopup2({
  error,
  onClose
}) {
  if (!error) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!error, onOpenChange: (open) => !open && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "font-display text-base flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-destructive" }),
      "Error Details"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-sm", children: [
      error.courseName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Course" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-primary mt-0.5", children: error.courseName })
      ] }),
      error.courseId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Course ID" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-foreground mt-0.5", children: error.courseId })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Error Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs", children: error.errorType }) })
      ] }),
      error.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Description" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-foreground leading-relaxed", children: error.description })
      ] }),
      error.studentId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 border-t", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Student Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 space-y-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-sm", children: [
            "ID: ",
            error.studentId
          ] }),
          error.email && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: error.email })
        ] })
      ] })
    ] })
  ] }) });
});
function PaymentBadge({ status }) {
  if (!status) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Badge,
      {
        variant: "outline",
        className: "border-orange-400 text-orange-700 bg-orange-50 text-xs",
        children: "Do First"
      }
    );
  }
  const norm = normalizePaymentStatus(status);
  if (norm === "done") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Badge,
      {
        variant: "outline",
        className: "border-green-400 text-green-700 bg-green-50 text-xs",
        children: "Done"
      }
    );
  }
  if (norm === "redo") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Badge,
      {
        variant: "outline",
        className: "border-yellow-400 text-yellow-700 bg-yellow-50 text-xs",
        children: "Redo"
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Badge,
    {
      variant: "outline",
      className: "border-orange-400 text-orange-700 bg-orange-50 text-xs",
      children: "Do First"
    }
  );
}
const EmptyState = reactExports.memo(function EmptyState2({
  ocid,
  title,
  description,
  icon
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": ocid,
      className: "flex flex-col items-center gap-3 py-12 text-center text-muted-foreground",
      children: [
        icon ?? /* @__PURE__ */ jsxRuntimeExports.jsx(FileX, { className: "h-10 w-10 text-muted-foreground/50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm max-w-sm", children: description })
      ]
    }
  );
});
const EnrollmentTable = reactExports.memo(function EnrollmentTable2({
  records,
  ocid
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "rounded-lg border overflow-hidden overflow-x-auto",
      "data-ocid": ocid,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "bg-muted/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "#" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Student ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Email ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Course ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Course Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Duration" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: records.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          TableRow,
          {
            "data-ocid": `enrollment.row.${i + 1}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground text-xs", children: i + 1 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-sm", children: row.studentId || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-sm", children: row.email || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-sm", children: row.courseId }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: row.courseName ?? "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: row.duration ?? "12 weeks" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-green-100 text-green-800", children: row.enrollmentStatus ?? "Enrolled" }) })
            ]
          },
          `${row.courseId}-${i}`
        )) })
      ] })
    }
  );
});
const ExamRegTable = reactExports.memo(function ExamRegTable2({
  records,
  ocid
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "rounded-lg border overflow-hidden overflow-x-auto",
      "data-ocid": ocid,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "bg-indigo-50/60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "#" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Student ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Email ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Course ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Course Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Payment Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-indigo-700", children: "Registration Status" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: records.map((row, i) => {
          const norm = normalizePaymentStatus(row.paymentStatus ?? "");
          const regLabel = norm === "done" ? "Complete" : norm === "redo" ? "Redo Registration" : "Register First";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            TableRow,
            {
              "data-ocid": `exam_reg.row.${i + 1}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground text-xs", children: i + 1 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-sm", children: row.studentId || "-" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-sm", children: row.email || "-" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono text-sm", children: row.courseId }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: row.courseName ?? "-" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBadge, { status: row.paymentStatus }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `text-sm font-medium ${norm === "done" ? "text-green-700" : norm === "redo" ? "text-yellow-700" : "text-orange-700"}`,
                    children: regLabel
                  }
                ) })
              ]
            },
            `${row.courseId}-${i}`
          );
        }) })
      ] })
    }
  );
});
const ErrorList = reactExports.memo(function ErrorList2({
  errors,
  ocid,
  rowOcidPrefix,
  onSelect
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-lg border border-red-200 bg-red-50 p-4",
      "data-ocid": ocid,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-red-600" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-red-700 text-sm", children: [
            "Errors Found (",
            errors.length,
            ") — Click an error to view details"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: errors.map((err, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => onSelect(err),
            "data-ocid": `${rowOcidPrefix}.${i + 1}`,
            className: "w-full text-left rounded border border-red-200 bg-card hover:bg-red-50 hover:border-red-300 transition-colors p-3 text-sm cursor-pointer",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-1", children: [
                err.courseName && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5 text-sm", children: err.courseName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs shrink-0", children: err.errorType })
              ] }),
              err.courseId && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono text-muted-foreground", children: [
                "ID: ",
                err.courseId
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1 italic", children: "Click to view full description →" })
            ]
          },
          err.id
        )) })
      ]
    }
  );
});
function ShuffleCard({ record }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card shadow-sm p-5 space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shuffle, { className: "h-5 w-5 text-indigo-600" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-base", children: record.courseName ?? "Exam Details" }),
        record.courseId && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-mono text-muted-foreground", children: record.courseId })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        InfoField,
        {
          label: "Roll No",
          value: record.rollNo,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "h-3.5 w-3.5" })
        }
      ),
      record.examCenter && /* @__PURE__ */ jsxRuntimeExports.jsx(
        InfoField,
        {
          label: "Exam Center",
          value: record.examCenter,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5" })
        }
      ),
      record.examDate && /* @__PURE__ */ jsxRuntimeExports.jsx(
        InfoField,
        {
          label: "Exam Date",
          value: record.examDate,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5" })
        }
      ),
      record.timeSlot && /* @__PURE__ */ jsxRuntimeExports.jsx(
        InfoField,
        {
          label: "Time Slot",
          value: record.timeSlot,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3.5 w-3.5" })
        }
      ),
      record.hallTicketNo && /* @__PURE__ */ jsxRuntimeExports.jsx(InfoField, { label: "Hall Ticket No", value: record.hallTicketNo }),
      record.seatingNo && /* @__PURE__ */ jsxRuntimeExports.jsx(InfoField, { label: "Seating No", value: record.seatingNo })
    ] })
  ] });
}
function InfoField({
  label,
  value,
  icon
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
      icon,
      label
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm truncate", children: value ?? "-" })
  ] });
}
function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  ocid
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: id, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          id,
          "data-ocid": ocid,
          type: show ? "text" : "password",
          placeholder,
          value,
          onChange: (e) => onChange(e.target.value),
          required: true,
          className: "pr-10"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: onToggle,
          className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
          "aria-label": show ? "Hide password" : "Show password",
          children: show ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
        }
      )
    ] })
  ] });
}
function StudentDashboard() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const collegeName = params.collegeName ? decodeURIComponent(params.collegeName) : "";
  const {
    currentUser,
    logout,
    uploadedExamRegRecords,
    hodUploadedRecords,
    deanStudentDataUploaded,
    deanExamRegDataUploaded,
    deanShuffleDataUploaded,
    uploadedShuffleRecords,
    enrollmentErrors,
    examRegErrors,
    enrollmentIndexByStudentId,
    enrollmentIndexByEmail,
    examRegIndexByStudentId,
    examRegIndexByEmail,
    shuffleIndexByStudentId,
    shuffleIndexByEmail,
    enrollmentErrorsByStudentId,
    enrollmentErrorsByEmail,
    examRegErrorsByStudentId,
    examRegErrorsByEmail
  } = useAppContext();
  const [selectedError, setSelectedError] = reactExports.useState(null);
  const [currentPwd, setCurrentPwd] = reactExports.useState("");
  const [newPwd, setNewPwd] = reactExports.useState("");
  const [confirmPwd, setConfirmPwd] = reactExports.useState("");
  const [pwdError, setPwdError] = reactExports.useState("");
  const [showCurrentPwd, setShowCurrentPwd] = reactExports.useState(false);
  const [showNewPwd, setShowNewPwd] = reactExports.useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = reactExports.useState(false);
  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }
  const studentEmail = (currentUser == null ? void 0 : currentUser.email) ?? "";
  const rollNo = studentEmail.split("@")[0];
  const rollNoLower = rollNo.toLowerCase();
  const emailLower = studentEmail.toLowerCase();
  const campusKey = collegeName.toLowerCase().trim();
  const myEnrollmentRecords = reactExports.useMemo(() => {
    const byId = enrollmentIndexByStudentId.get(rollNoLower) ?? [];
    const byEmail = enrollmentIndexByEmail.get(emailLower) ?? [];
    const seen = /* @__PURE__ */ new Set();
    const merged = [];
    for (const r of [...byId, ...byEmail]) {
      const key = `${r.studentId.toLowerCase()}::${(r.courseId ?? "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!r.courseId) continue;
      merged.push(r);
    }
    return merged;
  }, [
    enrollmentIndexByStudentId,
    enrollmentIndexByEmail,
    rollNoLower,
    emailLower
  ]);
  const myExamRegRecords = reactExports.useMemo(() => {
    var _a, _b;
    const byId = examRegIndexByStudentId.get(rollNoLower) ?? [];
    const byEmail = examRegIndexByEmail.get(emailLower) ?? [];
    const seen = /* @__PURE__ */ new Set();
    const merged = [];
    for (const r of [...byId, ...byEmail]) {
      const key = `${r.studentId.toLowerCase()}::${(r.courseId ?? "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }
    for (const r of hodUploadedRecords) {
      if (!r.paymentStatus) continue;
      if (((_a = r.studentId) == null ? void 0 : _a.toLowerCase()) !== rollNoLower && ((_b = r.email) == null ? void 0 : _b.toLowerCase()) !== emailLower)
        continue;
      const key = `${r.studentId.toLowerCase()}::${(r.courseId ?? "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }
    return merged;
  }, [
    examRegIndexByStudentId,
    examRegIndexByEmail,
    rollNoLower,
    emailLower,
    hodUploadedRecords
  ]);
  const myShuffleRecords = reactExports.useMemo(() => {
    const hasIndex = shuffleIndexByStudentId.size > 0 || shuffleIndexByEmail.size > 0;
    if (hasIndex) {
      const byId = shuffleIndexByStudentId.get(rollNoLower) ?? [];
      const byEmail = shuffleIndexByEmail.get(emailLower) ?? [];
      const seen = /* @__PURE__ */ new Set();
      return [...byId, ...byEmail].filter((r) => {
        const key = `${r.rollNo}::${r.courseId ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return uploadedShuffleRecords.filter(
      (r) => {
        var _a;
        return ((_a = r.rollNo) == null ? void 0 : _a.toLowerCase()) === rollNoLower;
      }
    );
  }, [
    shuffleIndexByStudentId,
    shuffleIndexByEmail,
    rollNoLower,
    emailLower,
    uploadedShuffleRecords
  ]);
  const myEnrollmentErrors = reactExports.useMemo(() => {
    const hasIndex = enrollmentErrorsByStudentId.size > 0 || enrollmentErrorsByEmail.size > 0;
    if (hasIndex) {
      const byId = enrollmentErrorsByStudentId.get(rollNoLower) ?? [];
      const byEmail = enrollmentErrorsByEmail.get(emailLower) ?? [];
      const seen = /* @__PURE__ */ new Set();
      return [...byId, ...byEmail].filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    }
    return enrollmentErrors.filter(
      (e) => {
        var _a, _b;
        return ((_a = e.email) == null ? void 0 : _a.toLowerCase()) === emailLower || ((_b = e.studentId) == null ? void 0 : _b.toLowerCase()) === rollNoLower;
      }
    );
  }, [
    enrollmentErrorsByStudentId,
    enrollmentErrorsByEmail,
    rollNoLower,
    emailLower,
    enrollmentErrors
  ]);
  const myExamRegErrors = reactExports.useMemo(() => {
    const hasIndex = examRegErrorsByStudentId.size > 0 || examRegErrorsByEmail.size > 0;
    if (hasIndex) {
      const byId = examRegErrorsByStudentId.get(rollNoLower) ?? [];
      const byEmail = examRegErrorsByEmail.get(emailLower) ?? [];
      const seen = /* @__PURE__ */ new Set();
      return [...byId, ...byEmail].filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    }
    return examRegErrors.filter(
      (e) => {
        var _a, _b;
        return ((_a = e.email) == null ? void 0 : _a.toLowerCase()) === emailLower || ((_b = e.studentId) == null ? void 0 : _b.toLowerCase()) === rollNoLower;
      }
    );
  }, [
    examRegErrorsByStudentId,
    examRegErrorsByEmail,
    rollNoLower,
    emailLower,
    examRegErrors
  ]);
  const studentName = reactExports.useMemo(
    () => {
      var _a, _b, _c;
      return ((_a = myEnrollmentRecords.find((r) => r.name)) == null ? void 0 : _a.name) ?? ((_b = myExamRegRecords.find((r) => r.name)) == null ? void 0 : _b.name) ?? ((_c = myShuffleRecords.find((r) => r.name)) == null ? void 0 : _c.name) ?? null;
    },
    [myEnrollmentRecords, myExamRegRecords, myShuffleRecords]
  );
  const anyEnrollmentUploaded = deanStudentDataUploaded || hodUploadedRecords.length > 0;
  const anyExamRegUploaded = deanExamRegDataUploaded || hodUploadedRecords.some((r) => r.paymentStatus) || (uploadedExamRegRecords ?? []).length > 0;
  const hasEnrollmentData = myEnrollmentRecords.length > 0;
  const hasExamRegData = myExamRegRecords.length > 0;
  const hasShuffleData = myShuffleRecords.length > 0;
  function handleChangePassword(e) {
    e.preventDefault();
    setPwdError("");
    const storedPwd = loadStudentPassword(campusKey, rollNo);
    if (currentPwd !== storedPwd) {
      setPwdError("Current password is incorrect.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("New passwords do not match.");
      return;
    }
    saveStudentPassword(campusKey, rollNo, newPwd);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    ue.success("Password changed successfully!");
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ErrorPopup,
      {
        error: selectedError,
        onClose: () => setSelectedError(null)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "nptel-gradient text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 py-4 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => navigate({ to: `/college/${encodeURIComponent(collegeName)}` }),
          className: "text-white hover:bg-white/20 gap-2",
          "data-ocid": "student.back.button",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-px bg-white/30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "h-5 w-5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-display font-bold", children: [
          "Student Portal — ",
          collegeName
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-white/70 hidden sm:block", children: studentEmail }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: handleLogout,
            className: "text-white hover:bg-white/20 gap-2",
            "data-ocid": "student.logout.button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
              "Logout"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 container mx-auto px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 rounded-xl bg-gradient-to-r from-primary/10 to-secondary p-6 flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0",
                style: { background: "oklch(0.38 0.12 264)" },
                children: rollNo.substring(0, 2).toUpperCase()
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-widest", children: "Student" }),
              studentName ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-xl truncate", children: studentName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-mono", children: rollNo })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-xl", children: rollNo }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: collegeName })
            ] }),
            hasEnrollmentData && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "secondary",
                className: "ml-auto bg-green-100 text-green-800 shrink-0",
                "data-ocid": "student.status.badge",
                children: "Active Enrollment"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "enrollment", "data-ocid": "student.tabs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "mb-6 w-full sm:w-auto flex-wrap h-auto gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "enrollment",
                  "data-ocid": "student.enrollment.tab",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-4 w-4" }),
                    "Enrollment"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "exam-reg",
                  "data-ocid": "student.exam_reg.tab",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardCheck, { className: "h-4 w-4" }),
                    "Exam Registration"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "shuffle",
                  "data-ocid": "student.shuffle.tab",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Shuffle, { className: "h-4 w-4" }),
                    "Exam Shuffle"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TabsTrigger,
                {
                  value: "account",
                  "data-ocid": "student.account.tab",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-4 w-4" }),
                    "Account"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "enrollment", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-lg flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "h-5 w-5 text-primary" }),
                "Enrollment Details",
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Read-only" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: !anyEnrollmentUploaded ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyState,
                {
                  ocid: "student.enrollment.empty_state",
                  title: "No Enrollment Data Available",
                  description: "Enrollment data has not been uploaded yet. Please check back later."
                }
              ) : !hasEnrollmentData && myEnrollmentErrors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyState,
                {
                  ocid: "student.enrollment.not_found",
                  title: "Record Not Found",
                  description: "Your enrollment data was not found in the uploaded file. Please contact your HOD or Dean."
                }
              ) : myEnrollmentErrors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "student.enrollment.no_error_state",
                  className: "space-y-4",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3 py-6 text-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 text-green-500" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-green-700", children: "✓ No Enrollment Errors Found" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm max-w-sm text-muted-foreground", children: "Your enrollment data has no errors and is correctly registered." })
                    ] }),
                    hasEnrollmentData && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      EnrollmentTable,
                      {
                        records: myEnrollmentRecords,
                        ocid: "student.enrollment.table"
                      }
                    )
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                hasEnrollmentData && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  EnrollmentTable,
                  {
                    records: myEnrollmentRecords,
                    ocid: "student.enrollment.table"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ErrorList,
                  {
                    errors: myEnrollmentErrors,
                    ocid: "student.enrollment.errors",
                    rowOcidPrefix: "student.enrollment.error",
                    onSelect: setSelectedError
                  }
                )
              ] }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "exam-reg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-lg flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardCheck, { className: "h-5 w-5 text-indigo-600" }),
                "Exam Registration Details",
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Read-only" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: !anyExamRegUploaded ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyState,
                {
                  ocid: "student.exam_reg.empty_state",
                  title: "No Exam Registration Data",
                  description: "Exam registration data has not been uploaded yet. Please check back later."
                }
              ) : !hasExamRegData && myExamRegErrors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyState,
                {
                  ocid: "student.exam_reg.not_found",
                  title: "Record Not Found",
                  description: "Your exam registration data was not found in the uploaded file. Please contact your HOD or Dean."
                }
              ) : myExamRegErrors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "student.exam_reg.no_error_state",
                  className: "space-y-4",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3 py-6 text-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 text-green-500" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-green-700", children: "✓ No Exam Registration Errors Found" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm max-w-sm text-muted-foreground", children: "Your exam registration is correctly processed with no errors." })
                    ] }),
                    hasExamRegData && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      ExamRegTable,
                      {
                        records: myExamRegRecords,
                        ocid: "student.exam_reg.table"
                      }
                    )
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                hasExamRegData && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ExamRegTable,
                  {
                    records: myExamRegRecords,
                    ocid: "student.exam_reg.table"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ErrorList,
                  {
                    errors: myExamRegErrors,
                    ocid: "student.exam_reg.errors",
                    rowOcidPrefix: "student.exam_reg.error",
                    onSelect: setSelectedError
                  }
                )
              ] }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "shuffle", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-lg flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Shuffle, { className: "h-5 w-5 text-primary" }),
                "Exam Shuffle Details",
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Read-only" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: !deanShuffleDataUploaded ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyState,
                {
                  ocid: "student.shuffle.empty_state",
                  title: "Exam Shuffle Not Yet Released",
                  description: "Please check back after the Dean uploads the shuffle file. Your exam center, date, and time slot will appear here.",
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-10 w-10 text-muted-foreground/50" })
                }
              ) : !hasShuffleData ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyState,
                {
                  ocid: "student.shuffle.not_found",
                  title: "No Shuffle Details Found",
                  description: `The exam shuffle file has been uploaded but your details (${rollNo}) were not found. Please check with your department.`
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "space-y-3",
                  "data-ocid": "student.shuffle.table",
                  children: [
                    myShuffleRecords.map((record, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      ShuffleCard,
                      {
                        record
                      },
                      `${record.courseId ?? ""}-${i}`
                    )),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-3 italic", children: "* Exam center and time slot are final. Contact your Dean for queries." })
                  ]
                }
              ) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "account", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-lg flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-5 w-5 text-primary" }),
                "Account"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg bg-muted/50 border text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase tracking-wide mb-1", children: "Logged in as" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono font-medium text-foreground", children: studentEmail })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium mb-4", children: "Change Password" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "form",
                    {
                      onSubmit: handleChangePassword,
                      className: "space-y-4",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          PasswordField,
                          {
                            id: "current-pwd",
                            label: "Current Password",
                            value: currentPwd,
                            onChange: setCurrentPwd,
                            show: showCurrentPwd,
                            onToggle: () => setShowCurrentPwd(!showCurrentPwd),
                            placeholder: "Enter current password",
                            ocid: "student.account.current_pwd.input"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          PasswordField,
                          {
                            id: "new-pwd",
                            label: "New Password",
                            value: newPwd,
                            onChange: setNewPwd,
                            show: showNewPwd,
                            onToggle: () => setShowNewPwd(!showNewPwd),
                            placeholder: "Min. 6 characters",
                            ocid: "student.account.new_pwd.input"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          PasswordField,
                          {
                            id: "confirm-pwd",
                            label: "Confirm New Password",
                            value: confirmPwd,
                            onChange: setConfirmPwd,
                            show: showConfirmPwd,
                            onToggle: () => setShowConfirmPwd(!showConfirmPwd),
                            placeholder: "Repeat new password",
                            ocid: "student.account.confirm_pwd.input"
                          }
                        ),
                        pwdError && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "div",
                          {
                            "data-ocid": "student.account.error_state",
                            className: "flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 mt-0.5 shrink-0" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: pwdError })
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Button,
                          {
                            type: "submit",
                            "data-ocid": "student.account.save_button",
                            className: "w-full gap-2",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }),
                              "Update Password"
                            ]
                          }
                        )
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                    "Your Student ID:",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-medium text-foreground", children: rollNo })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1", children: [
                    "Default password is",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: "student123" }),
                    ". It is strongly recommended to change it."
                  ] })
                ] })
              ] })
            ] }) }) })
          ] })
        ]
      }
    ) })
  ] });
}
export {
  StudentDashboard as default
};
