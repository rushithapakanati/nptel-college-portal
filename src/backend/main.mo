import AccessControl "./authorization/access-control";
import MixinAuth "./authorization/MixinAuthorization";
import MixinBlob "./blob-storage/Mixin";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Map "mo:core/Map";

actor {

  let _accessControlState : AccessControl.AccessControlState = AccessControl.initState();
  include MixinAuth(_accessControlState);
  include MixinBlob();

  // ── Types ───────────────────────────────────────────────────────────────

  public type EnrollmentRecord = {
    id            : Text;
    studentId     : Text;
    email         : Text;
    courseId      : Text;
    courseName    : Text;
    durationWeeks : Nat;
    profession    : Text;
    branch        : Text;
    college       : Text;
    errors        : [Text];
  };

  public type ExamRegRecord = {
    id             : Text;
    studentId      : Text;
    email          : Text;
    courseId       : Text;
    paymentStatus  : Text;
    classification : Text;
    branch         : Text;
    college        : Text;
    errors         : [Text];
  };

  public type CourseRecord = {
    courseId      : Text;
    courseName    : Text;
    durationWeeks : Nat;
    branch        : Text;
    college       : Text;
  };

  public type HODPermission = {
    college                  : Text;
    branch                   : Text;
    canUploadEnrollment      : Bool;
    enrollmentEditsRemaining : Nat;
    canUploadExamReg         : Bool;
    examRegEditsRemaining    : Nat;
  };

  public type BranchStats = {
    branch              : Text;
    done                : Nat;
    redoRegistration    : Nat;
    doFirstRegistration : Nat;
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let hodPermissionsMap  : Map.Map<Text, HODPermission>    = Map.empty();
  let enrollmentMap      : Map.Map<Text, EnrollmentRecord> = Map.empty();
  let examRegMap         : Map.Map<Text, ExamRegRecord>    = Map.empty();
  let courseMap          : Map.Map<Text, CourseRecord>     = Map.empty();

  func hodKey(college : Text, branch : Text) : Text { college # ":" # branch };

  // ── HOD Permissions ──────────────────────────────────────────────────────
  public shared func setHODPermission(
    college             : Text,
    branch              : Text,
    canUploadEnrollment : Bool,
    enrollmentEdits     : Nat,
    canUploadExamReg    : Bool,
    examRegEdits        : Nat
  ) : async () {
    let perm : HODPermission = {
      college;
      branch;
      canUploadEnrollment;
      enrollmentEditsRemaining = enrollmentEdits;
      canUploadExamReg;
      examRegEditsRemaining    = examRegEdits;
    };
    hodPermissionsMap.add(hodKey(college, branch), perm);
  };

  public query func getHODPermission(college : Text, branch : Text) : async ?HODPermission {
    hodPermissionsMap.get(hodKey(college, branch))
  };

  public query func getAllHODPermissions() : async [HODPermission] {
    hodPermissionsMap.values().toArray()
  };

  // ── Courses ──────────────────────────────────────────────────────────────
  public shared func uploadCourses(records : [CourseRecord]) : async () {
    for (r in records.vals()) {
      courseMap.add(r.courseId # ":" # r.college, r);
    };
  };

  public query func getCoursesByBranchAndCollege(college : Text, branch : Text) : async [CourseRecord] {
    courseMap.values().toArray().filter(func(r : CourseRecord) : Bool {
      r.college == college and r.branch == branch and r.durationWeeks == 12
    })
  };

  public query func getAllCourses() : async [CourseRecord] {
    courseMap.values().toArray()
  };

  // ── Enrollment ───────────────────────────────────────────────────────────
  public shared func uploadEnrollmentRecords(college : Text, branch : Text, records : [EnrollmentRecord]) : async Bool {
    switch (hodPermissionsMap.get(hodKey(college, branch))) {
      case (null)  { false };
      case (?perm) {
        if (not perm.canUploadEnrollment) { return false };
        for (r in records.vals()) {
          enrollmentMap.add(r.id, r);
        };
        true
      };
    }
  };

  public shared func editEnrollmentRecord(college : Text, branch : Text, recordId : Text, updated : EnrollmentRecord) : async Bool {
    switch (hodPermissionsMap.get(hodKey(college, branch))) {
      case (null)  { false };
      case (?perm) {
        if (perm.enrollmentEditsRemaining == 0) { return false };
        enrollmentMap.add(recordId, updated);
        hodPermissionsMap.add(hodKey(college, branch), {
          college                  = perm.college;
          branch                   = perm.branch;
          canUploadEnrollment      = perm.canUploadEnrollment;
          enrollmentEditsRemaining = perm.enrollmentEditsRemaining - 1;
          canUploadExamReg         = perm.canUploadExamReg;
          examRegEditsRemaining    = perm.examRegEditsRemaining;
        });
        true
      };
    }
  };

  public query func getEnrollmentByBranch(college : Text, branch : Text) : async [EnrollmentRecord] {
    enrollmentMap.values().toArray().filter(func(r : EnrollmentRecord) : Bool {
      r.college == college and r.branch == branch
    })
  };

  public query func getAllEnrollmentErrors() : async [EnrollmentRecord] {
    enrollmentMap.values().toArray().filter(func(r : EnrollmentRecord) : Bool {
      r.errors.size() > 0
    })
  };

  // ── Exam Registration ────────────────────────────────────────────────────
  public shared func uploadExamRegRecords(college : Text, branch : Text, records : [ExamRegRecord]) : async Bool {
    switch (hodPermissionsMap.get(hodKey(college, branch))) {
      case (null)  { false };
      case (?perm) {
        if (not perm.canUploadExamReg) { return false };
        for (r in records.vals()) {
          examRegMap.add(r.id, r);
        };
        true
      };
    }
  };

  public shared func editExamRegRecord(college : Text, branch : Text, recordId : Text, updated : ExamRegRecord) : async Bool {
    switch (hodPermissionsMap.get(hodKey(college, branch))) {
      case (null)  { false };
      case (?perm) {
        if (perm.examRegEditsRemaining == 0) { return false };
        examRegMap.add(recordId, updated);
        hodPermissionsMap.add(hodKey(college, branch), {
          college                  = perm.college;
          branch                   = perm.branch;
          canUploadEnrollment      = perm.canUploadEnrollment;
          enrollmentEditsRemaining = perm.enrollmentEditsRemaining;
          canUploadExamReg         = perm.canUploadExamReg;
          examRegEditsRemaining    = perm.examRegEditsRemaining - 1;
        });
        true
      };
    }
  };

  public query func getExamRegByBranch(college : Text, branch : Text) : async [ExamRegRecord] {
    examRegMap.values().toArray().filter(func(r : ExamRegRecord) : Bool {
      r.college == college and r.branch == branch
    })
  };

  public query func getAllExamRegErrors() : async [ExamRegRecord] {
    examRegMap.values().toArray().filter(func(r : ExamRegRecord) : Bool {
      r.errors.size() > 0
    })
  };

  // ── Statistics ────────────────────────────────────────────────────────────
  public query func getStatsByBranch(college : Text) : async [BranchStats] {
    let branches : [Text] = ["CSE", "ECE", "EEE", "ME", "MME", "CHEM", "CE"];
    let all = examRegMap.values().toArray().filter(func(r : ExamRegRecord) : Bool {
      r.college == college
    });
    branches.map(func(b : Text) : BranchStats {
      let bRecs = all.filter(func(r : ExamRegRecord) : Bool { r.branch == b });
      var done    = 0;
      var redo    = 0;
      var doFirst = 0;
      for (r in bRecs.vals()) {
        if      (r.classification == "Done")              { done    += 1 }
        else if (r.classification == "RedoRegistration")  { redo    += 1 }
        else                                              { doFirst += 1 };
      };
      { branch = b; done; redoRegistration = redo; doFirstRegistration = doFirst }
    })
  };

  // ── Student View ──────────────────────────────────────────────────────────
  public query func getStudentEnrollment(studentId : Text, college : Text) : async [EnrollmentRecord] {
    enrollmentMap.values().toArray().filter(func(r : EnrollmentRecord) : Bool {
      r.studentId == studentId and r.college == college
    })
  };

  public query func getStudentExamReg(studentId : Text, college : Text) : async [ExamRegRecord] {
    examRegMap.values().toArray().filter(func(r : ExamRegRecord) : Bool {
      r.studentId == studentId and r.college == college
    })
  };
};
