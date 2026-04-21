import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";



actor {

  // ── Types ───────────────────────────────────────────────────────────────

  public type EnrollmentRecord = {
    id               : Text;
    studentId        : Text;
    email            : Text;
    courseId         : Text;
    courseName       : Text;
    branch           : Text;
    duration         : Text;
    status           : Text;
    hasError         : Bool;
    errorType        : Text;
    errorDescription : Text;
    college          : Text;
    yearKey          : Text;
  };

  public type ExamRegRecord = {
    id               : Text;
    studentId        : Text;
    email            : Text;
    courseId         : Text;
    courseName       : Text;
    branch           : Text;
    paymentStatus    : Text;
    registrationStatus : Text;
    hasError         : Bool;
    errorType        : Text;
    errorDescription : Text;
    college          : Text;
    yearKey          : Text;
  };

  public type ExamShuffleRecord = {
    id              : Text;
    studentId       : Text;
    rollNo          : Text;
    email           : Text;
    courseId        : Text;
    courseName      : Text;
    examCenter      : Text;
    examDate        : Text;
    timeSlot        : Text;
    hallTicketNo    : Text;
    seatingPosition : Text;
    branch          : Text;
    college         : Text;
    yearKey         : Text;
  };

  public type CourseRecord = {
    courseId   : Text;
    courseName : Text;
    duration   : Text;
    category   : Text;
    college    : Text;
    yearKey    : Text;
  };

  public type HODPermission = {
    branch        : Text;
    uploadCredits : Nat;
    editCredits   : Nat;
    college       : Text;
    yearKey       : Text;
  };

  public type BranchStats = {
    branch              : Text;
    enrollmentTotal     : Nat;
    enrollmentErrors    : Nat;
    examRegTotal        : Nat;
    examRegDone         : Nat;
    examRegRedo         : Nat;
    examRegDoFirst      : Nat;
    examRegErrors       : Nat;
  };

  public type OverviewStats = {
    totalEnrolled    : Nat;
    enrollmentErrors : Nat;
    cleanEnrollment  : Nat;
    totalRegistered  : Nat;
    examRegDone      : Nat;
    examRegRedo      : Nat;
    examRegDoFirst   : Nat;
    examRegErrors    : Nat;
  };

  public type FileSnapshot = {
    id          : Text;
    timestamp   : Int;
    filename    : Text;
    recordCount : Nat;
    isActive    : Bool;
  };

  public type EditedRecord = {
    id         : Text;
    timestamp  : Int;
    studentId  : Text;
    field      : Text;
    oldValue   : Text;
    newValue   : Text;
    branch     : Text;
    editedBy   : Text;
    recordType : Text;
    college    : Text;
    yearKey    : Text;
  };

  // Paginated result types
  public type EnrollmentPage = {
    data       : [EnrollmentRecord];
    hasMore    : Bool;
    totalCount : Nat;
  };

  public type ExamRegPage = {
    data       : [ExamRegRecord];
    hasMore    : Bool;
    totalCount : Nat;
  };

  public type ExamShufflePage = {
    data       : [ExamShuffleRecord];
    hasMore    : Bool;
    totalCount : Nat;
  };

  // ── State ─────────────────────────────────────────────────────────────────

  let hodPermissionsMap  : Map.Map<Text, HODPermission>           = Map.empty();
  let enrollmentMap      : Map.Map<Text, EnrollmentRecord>        = Map.empty();
  let examRegMap         : Map.Map<Text, ExamRegRecord>           = Map.empty();
  let examShuffleMap     : Map.Map<Text, ExamShuffleRecord>       = Map.empty();
  let courseMap          : Map.Map<Text, CourseRecord>            = Map.empty();
  let fileSnapshotMap    : Map.Map<Text, List.List<FileSnapshot>> = Map.empty();
  let editedRecordsList  : List.List<EditedRecord>                = List.empty();

  // ── Stats Cache ────────────────────────────────────────────────────────────
  // Cache keyed by "yearKey:college" for overview and "yearKey:college:branch" for branch stats.
  // Set to null on any upload to force recomputation on next query.

  let overviewStatsCache  : Map.Map<Text, OverviewStats> = Map.empty();
  let branchStatsCache    : Map.Map<Text, BranchStats>   = Map.empty();

  func overviewCacheKey(college : Text, yearKey : Text) : Text {
    yearKey # ":" # college
  };

  func branchCacheKey(college : Text, yearKey : Text, branch : Text) : Text {
    yearKey # ":" # college # ":" # branch
  };

  func invalidateStatsCache(college : Text, yearKey : Text) {
    let oKey = overviewCacheKey(college, yearKey);
    overviewStatsCache.remove(oKey);
    // Invalidate all branch cache entries for this college+yearKey by prefix scan
    let prefix = yearKey # ":" # college # ":";
    let toRemove = List.empty<Text>();
    for ((k, _) in branchStatsCache.entries()) {
      if (k.startsWith(#text prefix)) {
        toRemove.add(k);
      };
    };
    toRemove.forEach(func(k : Text) {
      branchStatsCache.remove(k);
    });
  };

  // ── Key helpers ───────────────────────────────────────────────────────────

  func hodKey(college : Text, yearKey : Text, branch : Text) : Text {
    yearKey # ":" # college # ":" # branch
  };

  func snapshotKey(college : Text, yearKey : Text, fileType : Text) : Text {
    yearKey # ":" # college # ":" # fileType
  };

  // ── File Snapshots ───────────────────────────────────────────────────────

  func recordSnapshot(
    college     : Text,
    yearKey     : Text,
    fileType    : Text,
    snapshotId  : Text,
    filename    : Text,
    recordCount : Nat
  ) {
    let key = snapshotKey(college, yearKey, fileType);
    let snapshots = switch (fileSnapshotMap.get(key)) {
      case (?s) s;
      case null {
        let s = List.empty<FileSnapshot>();
        fileSnapshotMap.add(key, s);
        s
      };
    };
    snapshots.mapInPlace(func(snap : FileSnapshot) : FileSnapshot {
      { snap with isActive = false }
    });
    snapshots.add({
      id          = snapshotId;
      timestamp   = Time.now();
      filename;
      recordCount;
      isActive    = true;
    });
  };

  public query func getFileSnapshots(
    college  : Text,
    yearKey  : Text,
    fileType : Text
  ) : async [FileSnapshot] {
    let key = snapshotKey(college, yearKey, fileType);
    switch (fileSnapshotMap.get(key)) {
      case (?s) s.toArray();
      case null [];
    }
  };

  public shared func restoreSnapshot(
    college  : Text,
    yearKey  : Text,
    fileType : Text,
    snapshotId : Text
  ) : async Bool {
    let key = snapshotKey(college, yearKey, fileType);
    switch (fileSnapshotMap.get(key)) {
      case null false;
      case (?snapshots) {
        let found = snapshots.find(func(s : FileSnapshot) : Bool { s.id == snapshotId });
        switch (found) {
          case null false;
          case (?_) {
            snapshots.mapInPlace(func(snap : FileSnapshot) : FileSnapshot {
              { snap with isActive = snap.id == snapshotId }
            });
            // When restoring a snapshot, reload that snapshot's records as active
            true
          };
        }
      };
    }
  };

  // ── HOD Permissions ──────────────────────────────────────────────────────

  public shared func setHODPermission(
    college       : Text,
    yearKey       : Text,
    branch        : Text,
    uploadCredits : Nat,
    editCredits   : Nat
  ) : async () {
    hodPermissionsMap.add(hodKey(college, yearKey, branch), {
      branch;
      uploadCredits;
      editCredits;
      college;
      yearKey;
    });
  };

  public query func getHODPermission(college : Text, yearKey : Text, branch : Text) : async ?HODPermission {
    hodPermissionsMap.get(hodKey(college, yearKey, branch))
  };

  public query func getAllHODPermissions(college : Text, yearKey : Text) : async [HODPermission] {
    hodPermissionsMap.values()
      .filter(func(p : HODPermission) : Bool { p.yearKey == yearKey and p.college == college })
      .toArray()
  };

  // ── Courses ──────────────────────────────────────────────────────────────

  public shared func uploadCourses(_college : Text, yearKey : Text, records : [CourseRecord]) : async () {
    for (r in records.vals()) {
      courseMap.add(r.courseId # ":" # r.college # ":" # yearKey, r);
    };
    // Invalidate stats for all colleges since course matching affects error counts
    // We don't know which colleges are affected so we clear both caches entirely
    overviewStatsCache.clear();
    branchStatsCache.clear();
  };

  public query func getCoursesByBranchAndCollege(college : Text, yearKey : Text, branch : ?Text) : async [CourseRecord] {
    courseMap.values()
      .filter(func(r : CourseRecord) : Bool {
        r.college == college and r.yearKey == yearKey and
        (switch (branch) {
          case (?b) r.category == b;
          case null true;
        })
      })
      .toArray()
  };

  public query func getAllCourses(college : Text, yearKey : Text) : async [CourseRecord] {
    courseMap.values()
      .filter(func(r : CourseRecord) : Bool {
        r.college == college and r.yearKey == yearKey
      })
      .toArray()
  };

  // ── Enrollment ───────────────────────────────────────────────────────────

  public shared func uploadEnrollmentRecords(
    college    : Text,
    yearKey    : Text,
    branch     : Text,
    records    : [EnrollmentRecord]
  ) : async Bool {
    switch (hodPermissionsMap.get(hodKey(college, yearKey, branch))) {
      case null false;
      case (?perm) {
        if (perm.uploadCredits == 0) { return false };
        let snapshotId = college # ":" # yearKey # ":" # branch # ":e:" # Time.now().toText();
        let filename   = "enrollment-" # branch # ".csv";
        for (r in records.vals()) {
          enrollmentMap.add(r.id, r);
        };
        hodPermissionsMap.add(hodKey(college, yearKey, branch), {
          perm with uploadCredits = Nat.sub(perm.uploadCredits, 1)
        });
        recordSnapshot(college, yearKey, "enrollment-" # branch, snapshotId, filename, records.size());
        invalidateStatsCache(college, yearKey);
        true
      };
    }
  };

  public shared func uploadEnrollmentRecordsDean(
    college  : Text,
    yearKey  : Text,
    fileId   : Text,
    fileName : Text,
    records  : [EnrollmentRecord]
  ) : async () {
    for (r in records.vals()) {
      enrollmentMap.add(r.id, r);
    };
    recordSnapshot(college, yearKey, "enrollment", fileId, fileName, records.size());
    invalidateStatsCache(college, yearKey);
  };

  public shared func editEnrollmentRecord(
    college  : Text,
    yearKey  : Text,
    branch   : Text,
    recordId : Text,
    updated  : EnrollmentRecord,
    editorId : Text,
    field    : Text,
    oldValue : Text,
    newValue : Text
  ) : async Bool {
    switch (hodPermissionsMap.get(hodKey(college, yearKey, branch))) {
      case null false;
      case (?perm) {
        if (perm.editCredits == 0) { return false };
        enrollmentMap.add(recordId, updated);
        hodPermissionsMap.add(hodKey(college, yearKey, branch), {
          perm with editCredits = Nat.sub(perm.editCredits, 1)
        });
        editedRecordsList.add({
          id         = recordId # ":" # Time.now().toText();
          timestamp  = Time.now();
          studentId  = updated.studentId;
          field;
          oldValue;
          newValue;
          branch;
          editedBy   = editorId;
          recordType = "enrollment";
          college;
          yearKey;
        });
        invalidateStatsCache(college, yearKey);
        true
      };
    }
  };

  public query func getEnrollmentByBranch(college : Text, yearKey : Text, branch : Text) : async [EnrollmentRecord] {
    enrollmentMap.values()
      .filter(func(r : EnrollmentRecord) : Bool {
        r.college == college and r.branch == branch and r.yearKey == yearKey
      })
      .toArray()
  };

  public query func getAllEnrollmentErrors(college : Text, yearKey : Text) : async [EnrollmentRecord] {
    enrollmentMap.values()
      .filter(func(r : EnrollmentRecord) : Bool {
        r.college == college and r.yearKey == yearKey and r.hasError
      })
      .toArray()
  };

  // Original — kept for backward compatibility
  public query func getAllEnrollmentRecords(college : Text, yearKey : Text) : async [EnrollmentRecord] {
    enrollmentMap.values()
      .filter(func(r : EnrollmentRecord) : Bool {
        r.college == college and r.yearKey == yearKey
      })
      .toArray()
  };

  // Paginated version with optional branch and errorOnly filters
  public query func getEnrollmentRecordsPaged(
    college   : Text,
    yearKey   : Text,
    branch    : ?Text,
    errorOnly : ?Bool,
    offset    : Nat,
    limit     : Nat
  ) : async EnrollmentPage {
    let effectiveLimit = if (limit == 0 or limit > 100) { 100 } else { limit };
    let onlyErrors = switch (errorOnly) { case (?b) b; case null false };
    let filtered = enrollmentMap.values()
      .filter(func(r : EnrollmentRecord) : Bool {
        r.college == college and r.yearKey == yearKey and
        (switch (branch) {
          case (?b) r.branch == b;
          case null true;
        }) and
        (if (onlyErrors) { r.hasError } else { true })
      })
      .toArray();
    let total = filtered.size();
    let start = if (offset >= total) { total } else { offset };
    let end_  = if (start + effectiveLimit > total) { total } else { start + effectiveLimit };
    {
      data       = filtered.sliceToArray(start.toInt(), end_.toInt());
      hasMore    = end_ < total;
      totalCount = total;
    }
  };

  // ── Exam Registration ────────────────────────────────────────────────────

  public shared func uploadExamRegRecords(
    college  : Text,
    yearKey  : Text,
    branch   : Text,
    records  : [ExamRegRecord]
  ) : async Bool {
    switch (hodPermissionsMap.get(hodKey(college, yearKey, branch))) {
      case null false;
      case (?perm) {
        if (perm.uploadCredits == 0) { return false };
        let snapshotId = college # ":" # yearKey # ":" # branch # ":er:" # Time.now().toText();
        let filename   = "examreg-" # branch # ".csv";
        for (r in records.vals()) {
          examRegMap.add(r.id, r);
        };
        hodPermissionsMap.add(hodKey(college, yearKey, branch), {
          perm with uploadCredits = Nat.sub(perm.uploadCredits, 1)
        });
        recordSnapshot(college, yearKey, "examreg-" # branch, snapshotId, filename, records.size());
        invalidateStatsCache(college, yearKey);
        true
      };
    }
  };

  public shared func uploadExamRegRecordsDean(
    college  : Text,
    yearKey  : Text,
    fileId   : Text,
    fileName : Text,
    records  : [ExamRegRecord]
  ) : async () {
    for (r in records.vals()) {
      examRegMap.add(r.id, r);
    };
    recordSnapshot(college, yearKey, "examreg", fileId, fileName, records.size());
    invalidateStatsCache(college, yearKey);
  };

  public shared func editExamRegRecord(
    college  : Text,
    yearKey  : Text,
    branch   : Text,
    recordId : Text,
    updated  : ExamRegRecord,
    editorId : Text,
    field    : Text,
    oldValue : Text,
    newValue : Text
  ) : async Bool {
    switch (hodPermissionsMap.get(hodKey(college, yearKey, branch))) {
      case null false;
      case (?perm) {
        if (perm.editCredits == 0) { return false };
        examRegMap.add(recordId, updated);
        hodPermissionsMap.add(hodKey(college, yearKey, branch), {
          perm with editCredits = Nat.sub(perm.editCredits, 1)
        });
        editedRecordsList.add({
          id         = recordId # ":" # Time.now().toText();
          timestamp  = Time.now();
          studentId  = updated.studentId;
          field;
          oldValue;
          newValue;
          branch;
          editedBy   = editorId;
          recordType = "examreg";
          college;
          yearKey;
        });
        invalidateStatsCache(college, yearKey);
        true
      };
    }
  };

  public query func getExamRegByBranch(college : Text, yearKey : Text, branch : Text) : async [ExamRegRecord] {
    examRegMap.values()
      .filter(func(r : ExamRegRecord) : Bool {
        r.college == college and r.branch == branch and r.yearKey == yearKey
      })
      .toArray()
  };

  public query func getAllExamRegErrors(college : Text, yearKey : Text) : async [ExamRegRecord] {
    examRegMap.values()
      .filter(func(r : ExamRegRecord) : Bool {
        r.college == college and r.yearKey == yearKey and r.hasError
      })
      .toArray()
  };

  // Original — kept for backward compatibility
  public query func getAllExamRegRecords(college : Text, yearKey : Text) : async [ExamRegRecord] {
    examRegMap.values()
      .filter(func(r : ExamRegRecord) : Bool {
        r.college == college and r.yearKey == yearKey
      })
      .toArray()
  };

  // Paginated version with optional branch and errorOnly filters
  public query func getExamRegRecordsPaged(
    college   : Text,
    yearKey   : Text,
    branch    : ?Text,
    errorOnly : ?Bool,
    offset    : Nat,
    limit     : Nat
  ) : async ExamRegPage {
    let effectiveLimit = if (limit == 0 or limit > 100) { 100 } else { limit };
    let onlyErrors = switch (errorOnly) { case (?b) b; case null false };
    let filtered = examRegMap.values()
      .filter(func(r : ExamRegRecord) : Bool {
        r.college == college and r.yearKey == yearKey and
        (switch (branch) {
          case (?b) r.branch == b;
          case null true;
        }) and
        (if (onlyErrors) { r.hasError } else { true })
      })
      .toArray();
    let total = filtered.size();
    let start = if (offset >= total) { total } else { offset };
    let end_  = if (start + effectiveLimit > total) { total } else { start + effectiveLimit };
    {
      data       = filtered.sliceToArray(start.toInt(), end_.toInt());
      hasMore    = end_ < total;
      totalCount = total;
    }
  };

  // ── Exam Shuffle ─────────────────────────────────────────────────────────

  public shared func uploadExamShuffleRecords(
    college  : Text,
    yearKey  : Text,
    fileId   : Text,
    fileName : Text,
    records  : [ExamShuffleRecord]
  ) : async () {
    for (r in records.vals()) {
      examShuffleMap.add(r.id, r);
    };
    recordSnapshot(college, yearKey, "shuffle", fileId, fileName, records.size());
  };

  public query func getExamShuffleByStudent(
    college   : Text,
    yearKey   : Text,
    studentId : Text
  ) : async [ExamShuffleRecord] {
    examShuffleMap.values()
      .filter(func(r : ExamShuffleRecord) : Bool {
        r.college == college and r.yearKey == yearKey and
        (r.studentId == studentId or r.rollNo == studentId)
      })
      .toArray()
  };

  // Original — kept for backward compatibility
  public query func getAllExamShuffle(college : Text, yearKey : Text) : async [ExamShuffleRecord] {
    examShuffleMap.values()
      .filter(func(r : ExamShuffleRecord) : Bool {
        r.college == college and r.yearKey == yearKey
      })
      .toArray()
  };

  // Paginated version
  public query func getExamShufflePaged(
    college : Text,
    yearKey : Text,
    offset  : Nat,
    limit   : Nat
  ) : async ExamShufflePage {
    let effectiveLimit = if (limit == 0 or limit > 100) { 100 } else { limit };
    let filtered = examShuffleMap.values()
      .filter(func(r : ExamShuffleRecord) : Bool {
        r.college == college and r.yearKey == yearKey
      })
      .toArray();
    let total = filtered.size();
    let start = if (offset >= total) { total } else { offset };
    let end_  = if (start + effectiveLimit > total) { total } else { start + effectiveLimit };
    {
      data       = filtered.sliceToArray(start.toInt(), end_.toInt());
      hasMore    = end_ < total;
      totalCount = total;
    }
  };

  public query func isShuffleUploaded(college : Text, yearKey : Text) : async Bool {
    let key = snapshotKey(college, yearKey, "shuffle");
    switch (fileSnapshotMap.get(key)) {
      case null false;
      case (?s) s.size() > 0;
    }
  };

  // ── Statistics ────────────────────────────────────────────────────────────

  func computeStatsByBranch(college : Text, yearKey : Text, branch : Text) : BranchStats {
    let bEnroll = enrollmentMap.values()
      .filter(func(r : EnrollmentRecord) : Bool {
        r.college == college and r.yearKey == yearKey and r.branch == branch
      })
      .toArray();
    let bExamReg = examRegMap.values()
      .filter(func(r : ExamRegRecord) : Bool {
        r.college == college and r.yearKey == yearKey and r.branch == branch
      })
      .toArray();
    var done          = 0;
    var redo          = 0;
    var doFirst       = 0;
    var examRegErrors = 0;
    var enrollErrors  = 0;
    for (r in bExamReg.vals()) {
      if      (r.registrationStatus == "Done")              { done    += 1 }
      else if (r.registrationStatus == "RedoRegistration")  { redo    += 1 }
      else                                                  { doFirst += 1 };
      if (r.hasError) { examRegErrors += 1 };
    };
    for (r in bEnroll.vals()) {
      if (r.hasError) { enrollErrors += 1 };
    };
    {
      branch;
      enrollmentTotal  = bEnroll.size();
      enrollmentErrors = enrollErrors;
      examRegTotal     = bExamReg.size();
      examRegDone      = done;
      examRegRedo      = redo;
      examRegDoFirst   = doFirst;
      examRegErrors;
    }
  };

  public shared func getStatsByBranch(college : Text, yearKey : Text, branch : Text) : async BranchStats {
    let cacheKey = branchCacheKey(college, yearKey, branch);
    switch (branchStatsCache.get(cacheKey)) {
      case (?cached) cached;
      case null {
        let result = computeStatsByBranch(college, yearKey, branch);
        branchStatsCache.add(cacheKey, result);
        result
      };
    }
  };

  func computeOverviewStats(college : Text, yearKey : Text) : OverviewStats {
    let allEnroll = enrollmentMap.values()
      .filter(func(r : EnrollmentRecord) : Bool { r.college == college and r.yearKey == yearKey })
      .toArray();
    let allExamReg = examRegMap.values()
      .filter(func(r : ExamRegRecord) : Bool { r.college == college and r.yearKey == yearKey })
      .toArray();
    var done          = 0;
    var redo          = 0;
    var doFirst       = 0;
    var examRegErrors = 0;
    var enrollErrors  = 0;
    for (r in allExamReg.vals()) {
      if      (r.registrationStatus == "Done")              { done    += 1 }
      else if (r.registrationStatus == "RedoRegistration")  { redo    += 1 }
      else                                                  { doFirst += 1 };
      if (r.hasError) { examRegErrors += 1 };
    };
    for (r in allEnroll.vals()) {
      if (r.hasError) { enrollErrors += 1 };
    };
    {
      totalEnrolled    = allEnroll.size();
      enrollmentErrors = enrollErrors;
      cleanEnrollment  = if (allEnroll.size() >= enrollErrors) { Nat.sub(allEnroll.size(), enrollErrors) } else { 0 };
      totalRegistered  = allExamReg.size();
      examRegDone      = done;
      examRegRedo      = redo;
      examRegDoFirst   = doFirst;
      examRegErrors;
    }
  };

  public shared func getOverviewStats(college : Text, yearKey : Text) : async OverviewStats {
    let cacheKey = overviewCacheKey(college, yearKey);
    switch (overviewStatsCache.get(cacheKey)) {
      case (?cached) cached;
      case null {
        let result = computeOverviewStats(college, yearKey);
        overviewStatsCache.add(cacheKey, result);
        result
      };
    }
  };

  // ── Student View ──────────────────────────────────────────────────────────

  public query func getStudentEnrollment(
    college   : Text,
    yearKey   : Text,
    studentId : Text
  ) : async [EnrollmentRecord] {
    enrollmentMap.values()
      .filter(func(r : EnrollmentRecord) : Bool {
        r.college == college and r.yearKey == yearKey and
        (r.studentId == studentId or r.email == studentId)
      })
      .toArray()
  };

  public query func getStudentExamReg(
    college   : Text,
    yearKey   : Text,
    studentId : Text
  ) : async [ExamRegRecord] {
    examRegMap.values()
      .filter(func(r : ExamRegRecord) : Bool {
        r.college == college and r.yearKey == yearKey and
        (r.studentId == studentId or r.email == studentId)
      })
      .toArray()
  };

  // ── HOD Edit History ──────────────────────────────────────────────────────

  public query func getEditedRecords(
    college : Text,
    yearKey : Text,
    branch  : Text
  ) : async [EditedRecord] {
    editedRecordsList.values()
      .filter(func(e : EditedRecord) : Bool {
        e.college == college and e.branch == branch and e.yearKey == yearKey
      })
      .toArray()
  };

  public query func getAllEditedRecords(college : Text, yearKey : Text) : async [EditedRecord] {
    editedRecordsList.values()
      .filter(func(e : EditedRecord) : Bool {
        e.college == college and e.yearKey == yearKey
      })
      .toArray()
  };
};
