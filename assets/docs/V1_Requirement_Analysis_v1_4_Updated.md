# Software Requirements Specification

## Team V1 - AI & Motion Recognition

**Requirement Analysis - Updated Version**  
**Project:** Limb Motion Recognition and Assistant  
**Prepared for:** Distributed Software Development 2025-2026  
**Prepared by:** Team V1 - AI & Motion Recognition  
**Original date:** 3 April 2026  
**Updated date:** 6 May 2026  
**Version:** 1.4

> This version keeps V2 as the only direct communication point for Team V1. It also clarifies the practical Generation 1 scope after the latest team-leader alignment: for now, the patient uploads two angle values inside the current `jointAngles` format, and V1 produces a plain-text recommendation through V2. A future generation may use the richer `targetAngles` / `sensorData` / `errors` format for a more complete IMU-based AI pipeline.

---

## Revision History

| Date | Author | Description |
|---|---|---|
| 3 Apr 2026 | Team V1 | Initial Requirement Analysis. V1 expected direct input from S2 and output to V2. |
| 6 May 2026 | Team V1 | Version 1.2 aligned V1 with Total System Design and Total Interface Specification. V1 input was moved to V2 and S2 became an indirect upstream source. |
| 6 May 2026 | Team V1 | Version 1.3 added a Generation 1 / Future Generation distinction. Generation 1 uses the current deployed V2 API; the future generation keeps the richer `targetAngles + sensorData + errors` direction. |
| 6 May 2026 | Team V1 | Version 1.4 clarifies that Generation 1 uses two patient-uploaded angle values inside `jointAngles`, and that the immediate V1 output is a plain-text recommendation sent to V2. |

---

## Document Overview

| Field | Value |
|---|---|
| Area | Server |
| Team | V1 - AI & Motion Recognition |
| Main role | Read motion/session measurements from V2, analyse the available angle values, and provide recommendation/results back to V2. |
| Main dependencies | V2 for direct server-side input/output; S2 and M1 as indirect upstream sources of formatted data; M1/M2 as downstream consumers through V2. |
| Main deliverables | Generation 1 two-angle analysis, plain-text recommendation output to V2, preprocessing and validation logic, future IMU-ready pipeline, processing metadata, and error/status handling when supported. |

---

## 0. Background

This document describes the updated requirement analysis for Team V1 in the Limb Motion Recognition and Assistant project. The project is developed in a distributed setting between UTAD and Jilin University.

Team V1 is responsible for the AI and motion-recognition part of the Server pipeline. V1 is not responsible for physical sensors, the patient mobile application, the clinical dashboard, or the V2 database implementation.

The current integrated architecture places V2 as the central server-side hub. V1 reads measurements from V2, processes them, and writes analysis results or recommendations back to V2. S2 remains the upstream source of formatted sensor information, but V1 does not communicate directly with S2.

For the current Generation 1 implementation, the latest team-leader alignment states that the patient uploads two angle values. These values are handled through the current V2 `jointAngles` format. V1 uses these two angles to create a plain-text recommendation. The doctor may also provide plain-text recommendation information. V1 output should therefore be treated as AI-assisted support information, not as a final clinical decision.

### 0.1 Purpose of this document

- Define the updated requirement analysis of Team V1 using the shared SRS style.
- Make clear what V1 expects to receive from V2.
- Make clear what V1 provides back to V2.
- Clarify that S2 is an indirect upstream dependency through M1 and V2.
- Separate the current Generation 1 implementation from the future richer IMU-based extension.
- Clarify that Generation 1 uses two patient-uploaded angle values and plain-text recommendations.
- Define the main V1 use cases, interfaces, and output delivery approach.

### 0.2 Scope of Team V1

- Read session measurements from V2 using the agreed V2 interface.
- For Generation 1, validate and preprocess two patient-uploaded angle values contained in `jointAngles`, plus `isCorrect`, `timestamp`, and `sessionId` from the current V2 API.
- For Generation 1, generate a simple plain-text recommendation using angle-based or rule-based logic.
- For a future generation, prepare for `targetAngles`, `sensorData`, timestamps, and `errors` when the richer interface is implemented.
- Run V1 analysis, inference, comparison, or rule-based recommendation logic according to the available data.
- Create structured recommendation/results and send them to V2 through `POST /recommendations`.
- Keep useful processing metadata, warnings, confidence values, and error states when supported by the interface.

### 0.3 Team boundaries

- S1 captures raw IMU data from sensors.
- S2 validates and formats sensor data and sends formatted data to M1. If target-angle values are produced by S2, V1 accesses them only after they are stored or exposed by V2.
- M1 acts as the App-side gateway to the Server and uploads measurements to V2.
- V2 stores measurements and exposes server-side API endpoints.
- V1 reads measurements from V2 and writes analysis/recommendation results back to V2.
- M1 and M2 consume V1 results indirectly through V2.
- Doctors may provide recommendation text through the appropriate Monitor/Server workflow, but V1 does not communicate directly with the doctor interface.

### 0.4 Implementation note - Generation 1 and future generation

For Generation 1, Team V1 will use the current deployed V2 API format. In this version, the patient uploads two angle values, and V2 exposes them inside the `jointAngles` object. Example:

```json
{
  "sessionId": 1,
  "jointAngles": {
    "knee": 45.0,
    "hip": 30.0
  },
  "isCorrect": false,
  "timestamp": "2026-05-05T10:00:00.000Z"
}
```

In this first generation, V1 does not receive raw IMU data and does not run a complete AI motion-recognition model. V1 uses the two uploaded angle values as input and produces a simple plain-text recommendation using rule-based or angle-based logic. This keeps the first integration stable and avoids requesting endpoint changes from V2 before the first presentation.

For a future generation, Team V1 expects the interface to evolve toward a richer format aligned with the integrated system documentation, using `targetAngles`, `sensorData`, and `errors`. This future format will be needed for a more complete AI-based motion recognition pipeline using raw IMU-style data.

Therefore, this requirement analysis supports two levels:

1. **Generation 1:** integration with the current V2 API using two angle values inside `jointAngles` and plain-text recommendation output;
2. **Future generation:** extended IMU-based pipeline using full sensor data, target/reference angle information, errors, sensor mapping, and labels when available.

In both levels, V1 communicates directly only with V2.

### 0.5 Cross-team data exchange

#### 0.5.1 What V1 expects to receive

| Source | Item | Why V1 Needs It | Notes |
|---|---|---|---|
| V2 - Backend API & Storage | Session measurements through `GET /measurements/:sessionId` | Main input path for V1 analysis. | Official V1 input path in the integrated system design. |
| V2 - Backend API & Storage | Generation 1 `jointAngles` / `joint_angles` | Current input X for V1. Contains two patient-uploaded angle values, for example `knee` and `hip`. | Exact angle names should be confirmed by V2/M1 if they differ from the example. |
| V2 - Backend API & Storage | Generation 1 `isCorrect` / `is_correct` | Current API field. May represent an existing classification/status field. | V1 should not use it as the answer for its own decision. It can be treated as state/label depending on the implementation. |
| V2 - Backend API & Storage | Generation 1 `timestamp` and `sessionId` / `session_id` | Needed to identify and trace the session and order measurements. | Required for linking V1 output back to the correct session. |
| V2 - Backend API & Storage | Future fields: `targetAngles` / `target_angles` | Future angle/reference information for V1. | Exact semantics still need confirmation. |
| V2 - Backend API & Storage | Future fields: `sensorData` / `sensor_data` | Input for future IMU-based motion recognition. | May include `sensorId`, `accX/Y/Z`, `gyroX/Y/Z`, `roll`, `pitch`, `yaw`, and timestamp. Depends on future V2/S2 alignment. |
| V2 - Backend API & Storage | Future fields: `errors` | Data-quality and sensor-error information. | Used to filter invalid data, create warnings, or reduce confidence. |
| S2 - Data Acquisition, indirectly through M1/V2 | Field meaning, sensor placement, target-angle meaning, sampling rules, and error rules | Needed to interpret future sensor data correctly. | S2 is not a direct V1 interface, but its definitions are still necessary. |
| M1/M2 through project alignment | Required recommendation display needs | Needed so V1 produces useful output for patient and clinician views. | V1 still sends results to V2, not directly to M1/M2. |

#### 0.5.2 What V1 will provide

| Receiver | Item | Purpose | Notes |
|---|---|---|---|
| V2 - Backend API & Storage | Plain-text recommendation / analysis result | Allows V2 to store and expose V1 output to M1 and M2. | Official output path: `POST /recommendations`. |
| V2 - Backend API & Storage | Movement name and confidence | Allows downstream systems to understand what was analysed and how confident V1 is. | Required by current recommendation schema if supported. |
| V2 - Backend API & Storage | Suggestion status | Allows M2 or other workflows to manage recommendation review state. | Current allowed values may include `pending`, `accepted`, `rejected`. |
| V2 - Backend API & Storage | Warnings, metadata, and detailed text when supported | Improves traceability and user-facing explanations. | Some fields may require future V2 schema extension. |
| M1/M2, indirectly via V2 | AI-assisted feedback/recommendation information | Allows patient and clinician interfaces to display V1 results. | No direct V1-to-M1 or V1-to-M2 interface. |
| Doctor workflow, indirectly through V2/M2 | Doctor plain-text recommendation or review | Allows medical recommendation text to coexist with V1 AI-assisted text. | V1 output is supportive and should not replace doctor judgement. |

#### 0.5.3 Interface definition summary

| Interface | Direction | Owners | Main Content |
|---|---|---|---|
| IF-V2-V1 | V2 -> V1 | V2 and V1 | Generation 1 measurements: two uploaded angle values inside `jointAngles` / `joint_angles`, `isCorrect` / `is_correct`, `timestamp`, `sessionId` / `session_id`. Future measurements: `targetAngles` / `target_angles`, `sensorData` / `sensor_data`, `errors`, timestamps, session identifiers, and related reference data. |
| IF-V1-V2 | V1 -> V2 | V1 and V2 | Recommendation or analysis result: `sessionId`, `movement`, `confidence`, `status`, and plain-text recommendation when supported. Future metadata may be added later. |
| Upstream data definitions | S2/M1 -> V2 -> V1 | S2, M1, V2, V1 | S2 defines sensor data meaning, target-angle computation, sensor mapping, and error representation; V1 receives any needed definitions through project alignment and V2 exposure. |

#### 0.5.4 Output delivery approach

- V1 will send its output to V2 using the agreed V2 endpoint, currently `POST /recommendations`.
- For Generation 1, the main output should be a plain-text recommendation based on the two uploaded angle values.
- Each result should include a session identifier, movement name, confidence value, and status when supported by the V2 schema.
- When supported, V1 should also include warnings, model/rule version, processing timestamp, and human-readable recommendation text.
- The output should be easy for V2 to store and easy for M1/M2 to consume through V2.
- V1 should not write directly to M1, M2, S1, or S2.

---

## 1. Use Cases

> Login, registration, account management, sensor connection, doctor review, and final user-interface actions are not included here because they belong more naturally to V2, S1/S2, M1, or M2. The use case diagram should show V2 as the main external actor for V1.

| ID | Use Case | Primary Actor | Priority |
|---|---|---|---|
| UC-V1-01 | Process Session Measurements from V2 | V2 - Backend API & Storage | High |
| UC-V1-02 | Analyse Uploaded Angle Values and Future Sensor Data | None (included internal V1 use case) | High |
| UC-V1-03 | Provide Plain-Text Recommendation Results to V2 | V2 - Backend API & Storage | High |

---

## 2.1 Process Session Measurements from V2

### 2.1.1 Basic Info

| Field | Value |
|---|---|
| Reference to Use Case | UC-V1-01 |
| Version | 1.4 |
| Created | 3 Apr 2026; updated 6 May 2026 |
| Authors | Team V1 - AI & Motion Recognition |
| Source | Server area / Team V1 |
| Actors | Primary actor: V2 - Backend API & Storage. Indirect upstream source: S2 through M1 and V2. |
| Goal | Receive session measurements from V2 and prepare them for V1 analysis. |
| Summary | This use case starts when V1 requests or receives available measurements for a session from V2. Generation 1 uses the current V2 API format, where the patient uploads two angle values inside `jointAngles`. A future generation may use the richer `targetAngles + sensorData + errors` format. |
| Trigger | A session is ready to be analysed, or V2 provides measurements for a session. |
| Frequency | Whenever V1 needs to analyse a rehabilitation session. |
| Precondition | V2 has a session identifier and available measurements; the V2 API is reachable; V1 processing service is available. |
| Postconditions | Cleaned and normalized data is available for V1 analysis, or a structured validation error is produced. |

**Flow Snapshot:** Request Measurements -> Validate Payload -> Normalize Fields -> Prepare Input -> Pass to Analysis

### 2.1.2 Basic Flow

| Actor | System (V1 Module) |
|---|---|
| V1 calls V2 using `GET /measurements/:sessionId`. | Receive measurement data for the requested session. |
| V2 returns available Generation 1 fields: `joint_angles`, `is_correct`, `timestamp`, and `session_id`. | Check whether the payload follows the current V2 response structure. |
| In Generation 1, `joint_angles` contains two uploaded angle values, for example knee and hip. | Validate the two angle values, timestamp, and session identifier. |
| In a future generation, V2 may return `target_angles`, `sensor_data`, `errors`, `timestamp`, and `session_id`. | Normalize the available fields for internal processing. |
|  | Handle optional or missing future fields without breaking Generation 1 processing. |
|  | Prepare cleaned data for analysis/recommendation logic. |

### 2.1.3 Alternative Flow

| Situation | System (V1 Module) |
|---|---|
| V2 API is unavailable. | Return an integration error and stop processing. |
| Measurements are empty. | Return no-data status. |
| Generation 1 `joint_angles` are missing or invalid. | Return validation warning or partial-processing status. |
| Only one of the two expected angle values is available. | Process partially if allowed, otherwise return an insufficient-data status. |
| Future `target_angles` are missing or unclear. | Use Generation 1 fields if available, or mark the result as assumption-dependent. |
| Future `sensor_data` is empty. | Continue with angle-based analysis if angle data is available. |
| `errors` are present. | Use them as data-quality warnings and adjust confidence or processing status. |

---

## 2.2 Analyse Uploaded Angle Values and Future Sensor Data

### 2.2.1 Basic Info

| Field | Value |
|---|---|
| Reference to Use Case | UC-V1-02 |
| Version | 1.4 |
| Created | 3 Apr 2026; updated 6 May 2026 |
| Authors | Team V1 - AI & Motion Recognition |
| Source | Server area / Team V1 |
| Actors | None as a direct external actor. This is an internal/included use case invoked by UC-V1-01. |
| Goal | Analyse the two uploaded angle values in Generation 1 and prepare for future sensor-data-based analysis. |
| Summary | Generation 1 uses two angle values inside `joint_angles` for rule-based or simple angle-based recommendation logic. A future generation can use `target_angles` and `sensor_data` for richer IMU-based motion recognition if complete data and mapping are available. |
| Trigger | Cleaned measurements are available after preprocessing. |
| Frequency | Whenever a session is processed by V1. |
| Precondition | Valid Generation 1 angle data exists, or future target/sensor data exists. Required rules/configuration are available. |
| Postconditions | A recommendation candidate, comparison result, raw prediction, or structured warning is produced. |

**Flow Snapshot:** Read Clean Data -> Apply Rules/Model -> Compare/Interpret -> Build Recommendation -> Send to Post-processing

### 2.2.2 Basic Flow

| Actor | System (V1 Module) |
|---|---|
| Internal V1 process starts after preprocessing. | Read the available measurement data and metadata. |
|  | For Generation 1, use the two angle values inside `joint_angles` for angle-based analysis and plain-text recommendation generation. |
|  | Use `is_correct` only as a current API field; the main V1 output path remains recommendations. |
|  | Classify the angle values using simple rules, thresholds, or rehabilitation guideline ranges when agreed. |
|  | For a future generation, use `target_angles`, `sensor_data`, and `errors` when available and semantically clear. |
|  | Create recommendation output with confidence, status, warnings, and plain text when supported. |

### 2.2.3 Alternative Flow

| Situation | System (V1 Module) |
|---|---|
| `joint_angles` are available but limited. | Run the Generation 1 angle-based fallback. |
| Exact names of the two angle fields are unclear. | Use configurable field mapping and request confirmation from V2/M1. |
| `target_angles` meaning is unclear. | Mark the result as assumption-dependent and request alignment with S2/V2. |
| `sensor_data` exists but sensor-to-joint mapping is missing. | Do not run full IMU-based model; return warning or use angle-based fallback. |
| `errors` indicate invalid sensor data. | Exclude affected data or reduce confidence. |
| Model/configuration is unavailable. | Use rule-based fallback if allowed, or return processing-failure status. |

---

## 2.3 Provide Plain-Text Recommendation Results to V2

### 2.3.1 Basic Info

| Field | Value |
|---|---|
| Reference to Use Case | UC-V1-03 |
| Version | 1.4 |
| Created | 3 Apr 2026; updated 6 May 2026 |
| Authors | Team V1 - AI & Motion Recognition |
| Source | Server area / Team V1 |
| Actors | Primary actor: V2 - Backend API & Storage. Downstream consumers: M1 and M2 through V2. |
| Goal | Provide V1 output to V2 in a stable and easy-to-use format. |
| Summary | This use case covers the handoff from V1 to V2. For Generation 1, V1 sends a plain-text recommendation or analysis result through `POST /recommendations` so V2 can store and expose it to other teams. |
| Trigger | A V1 recommendation candidate or analysis result is ready for delivery. |
| Frequency | Whenever V1 finishes a processing routine for a session. |
| Precondition | The V1-V2 recommendation contract exists and V1 has a result object. |
| Postconditions | V2 receives a recommendation/result payload or a structured error state. |

**Flow Snapshot:** Package Result -> Check Contract -> POST to V2 -> Store in V2 -> Available to M1/M2

### 2.3.2 Basic Flow

| Actor | System (V1 Module) |
|---|---|
| A V1 analysis routine finishes. | Package `sessionId`, `movement`, `confidence`, `status`, and plain-text recommendation when supported. |
|  | Add optional warning/metadata fields only if supported by V2. |
|  | Validate the payload against the agreed V2 recommendation schema. |
| V1 sends `POST /recommendations` to V2. | V2 stores the recommendation/result. |
| M1 or M2 later requests recommendations from V2. | V2 exposes V1 results through its own API. |

### 2.3.3 Alternative Flow

| Situation | System (V1 Module) |
|---|---|
| V2 recommendation endpoint is unavailable. | Return integration error and retry later if supported. |
| Required output fields are missing. | Reject the internal payload before sending to V2. |
| V2 does not support a dedicated recommendation text field. | Send the closest supported text/status field and keep detailed text internally or pending. |
| V2 does not support extended fields. | Send only the required fields and keep detailed metadata internally or pending. |
| Analysis confidence is low. | Send low-confidence status or warning if supported. |
| Doctor recommendation differs from V1 recommendation. | Treat both as separate recommendation sources if the platform supports it; doctor decision should have priority in clinical interpretation. |

---

## 3. Interface and Data Exchange Summary

### 3.1 IF-V2-V1 - Measurements from V2 to V1

| Field / Topic | Generation | What V1 Expects |
|---|---|---|
| `session_id` / `sessionId` | Both | Session identifier used to trace the measurements and later recommendation output. |
| `timestamp` | Both | ISO 8601 timestamp for measurement ordering and time alignment. |
| `joint_angles` / `jointAngles` | Generation 1 | Current deployed angle object used by the first V1 implementation. It contains two patient-uploaded angle values, for example `knee` and `hip`. |
| `is_correct` / `isCorrect` | Generation 1 | Current deployed boolean field. V1 should not treat this as the main long-term output path unless V2 confirms it. |
| `target_angles` / `targetAngles` | Future generation | Future angle stream. Each item should include timestamp, angle_id/angleID, and angle when implemented. |
| `sensor_data` / `sensorData` | Future generation | IMU-like data for future AI processing. Expected fields include timestamp, sensorId, accX/Y/Z, gyroX/Y/Z, roll, pitch, and yaw. |
| `errors` | Future generation | Error events or warnings that describe invalid, missing, or unreliable input. |
| reference/session context | Future generation | When available, V1 needs sensor-to-joint mapping, exercise type/payload status, and reference-rule information. |

### 3.2 IF-V1-V2 - Recommendations from V1 to V2

| Output Block | What V1 Should Send to V2 |
|---|---|
| `sessionId` | The session being analysed. |
| `movement` | Movement or exercise analysed by V1, for example knee flexion. |
| `confidence` | Confidence score between 0.0 and 1.0, when supported. |
| `status` | Initial recommendation status, normally pending unless otherwise agreed. |
| plain-text recommendation | Main Generation 1 recommendation output. Field name should follow V2's agreed schema, for example `recommendationText`, `notes`, or equivalent if supported. |
| Future optional details | Joint name, angle, phase, warnings, model/rule version, or processing timestamp if V2 supports them. |

### 3.3 Generation 1 and future V1 input/output view

| Version | Input X | Output Y | Notes |
|---|---|---|---|
| Generation 1 - current V2 API | `jointAngles` / `joint_angles` containing two patient-uploaded angle values, plus `timestamp`, `sessionId` / `session_id`, and current `isCorrect` / `is_correct` field | plain-text recommendation/result with `movement`, `confidence`, and `status` through `POST /recommendations` when supported | Supports first integration and rule-based analysis without changing V2 endpoints. |
| Future generation - richer interface | `targetAngles` / `target_angles`, `sensorData` / `sensor_data`, `errors`, timestamps, and sensor mapping | recommendation/result, possible detailed predictions, warnings, and metadata | Requires complete sensor data, sensor-to-joint mapping, labels, and V2 schema support. |

### 3.4 Delivery rules

- V1 input should come through V2, using the V2 measurements API.
- V1 output should go to V2, using the V2 recommendations API.
- For Generation 1, V1 should use the current V2 fields and avoid requesting endpoint changes before the first presentation.
- For Generation 1, V1 should treat the two uploaded angle values as the current input X.
- For Generation 1, V1 should treat the plain-text recommendation as the current output Y.
- For a future generation, V1 should be ready to support `targetAngles`, `sensorData`, and `errors` when V2 and S2 align the schema.
- Field names should follow V2 conventions: camelCase in requests and snake_case in responses.
- S2 remains important for the meaning of sensor and future target-angle fields, but V1 should not implement a direct S2 interface.

---

## 4. Functional Requirements Summary

| ID | Requirement | Notes |
|---|---|---|
| FR1 | The V1 module should receive session measurements from V2. | Input comes through `GET /measurements/:sessionId`. |
| FR2 | The V1 module should support the current Generation 1 V2 measurement format. | Current fields: `jointAngles` / `joint_angles`, `isCorrect` / `is_correct`, `timestamp`, `sessionId` / `session_id`. |
| FR3 | The V1 module should process two patient-uploaded angle values in Generation 1. | These values are expected inside `jointAngles`; example fields may be `knee` and `hip`. |
| FR4 | The V1 module should validate required fields before processing starts. | Examples: `session_id` / `sessionId`, `timestamp`, and available angle fields. |
| FR5 | The V1 module should transform valid input into analysis-ready data. | Preprocessing, normalization, timestamp alignment, and feature preparation. |
| FR6 | The V1 module should support a Generation 1 angle-based analysis path using `jointAngles`. | Useful for early integration and rule-based recommendations. |
| FR7 | The V1 module should generate a plain-text recommendation for Generation 1. | Output should be sent through `POST /recommendations` using the fields supported by V2. |
| FR8 | The V1 module should prepare for a future richer interface using `targetAngles`, `sensorData`, and `errors`. | Requires V2/S2 alignment and later schema support. |
| FR9 | The V1 module should support future IMU-based analysis using `sensorData` when available. | Requires mapping, sampling rules, labels, and complete sensor data. |
| FR10 | The V1 module should include confidence and status values with each result when supported. | Required or useful for downstream display and review. |
| FR11 | The V1 module should report processing errors, missing data, or low-confidence results consistently. | Important for traceability and downstream UI behaviour. |
| FR12 | The V1 module should keep useful model/rule and processing metadata when supported. | Examples: rule version, model version, processing timestamp, warnings. |

---

## 5. Non-Functional Requirements Summary

| ID | Requirement | Notes |
|---|---|---|
| NFR1 | Interface clarity | Input and output formats should be documented so V2, M1, M2, and S2 can understand them quickly. |
| NFR2 | Maintainability | The pipeline should separate V2 client, preprocessing, analysis, recommendation generation, and result publishing. |
| NFR3 | Testability | The module should support repeatable tests with sample measurements from V2. |
| NFR4 | Traceability | Processing status, assumptions, warnings, and technical limitations should be easy to review later. |
| NFR5 | Robustness | V1 should handle missing optional data, unavailable future fields, and error events without crashing. |
| NFR6 | Team readability | Documentation should use simple English and avoid unnecessary complexity. |
| NFR7 | Clinical caution | V1 recommendations should be written as AI-assisted support information, not as final medical decisions. |

---

## 6. Assumptions and Alignment Notes

- V2 is the official source and sink for V1 server-side communication.
- For Generation 1, the deployed V2 API uses `jointAngles + isCorrect + timestamp + sessionId`. V1 should support this format for the first integrated version.
- For Generation 1, the patient uploads two angle values, and V1 receives them inside `jointAngles` through V2.
- The exact names and semantics of the two angle values should be confirmed if they differ from the example `knee` and `hip`.
- For Generation 1, V1 produces a plain-text recommendation based on the uploaded angles.
- The doctor may also provide plain-text recommendation information. V1 output is AI-assisted support and should not replace doctor judgement.
- The richer integrated target format is `targetAngles + sensorData + errors`, with V2 responses expected to use snake_case when implemented.
- The future `targetAngles` / `sensorData` / `errors` format should be treated as a planned extension for later generations, not as a dependency for the first presentation.
- `target_angles` semantics still need confirmation with S2/V2 before they are used as final model input or comparison reference.
- `sensor_data` enables a future IMU-based pipeline, but full AI implementation depends on sensor placement, mapping, labels, and complete data availability.
- `POST /recommendations` is the confirmed V1 output path for the current generation.
- Detailed recommendation text, model metadata, and extra warning fields may require V2 schema support or field-name confirmation.

---

## 7. Open Questions

| Question | Why it matters |
|---|---|
| What are the exact names of the two angle values uploaded by the patient? | V1 needs stable field names or a mapping rule for Generation 1. |
| Are the two uploaded angles measured values, target/reference values, or patient-entered values? | V1 needs this to know how to interpret them. |
| Which field should V1 use for the plain-text recommendation in `POST /recommendations`? | V1 needs to match the V2 API exactly. |
| Should V1 and doctor recommendations be stored as separate recommendation sources? | This avoids confusing AI-assisted text with clinical text. |
| Should V1 update `isCorrect`, or should it only send recommendations for Generation 1? | This decides whether `isCorrect` remains only an input/status field or also a V1-updated result. |
| When will V2 move from the Generation 1 schema to the richer `targetAngles + sensorData + errors` schema? | This decides when V1 can start implementing the full IMU-based pipeline. |
| What exactly do `targetAngles` represent: measured angle, target/reference angle, or S2-computed movement angle? | V1 needs this to know whether it is an input feature, comparison target, or already processed result. |
| Will V2 store and return `sensorData` in a future generation? | This decides whether the future IMU-based pipeline can be implemented. |
| Where will `sensorJointMapping` and `payloadStatus` be exposed to V1? | V1 needs sensor-to-joint mapping and exercise type to interpret sensor data. |
| What recommendation fields do M1 and M2 need to display? | V1 output should be useful for patient and clinician interfaces. |

---

## 8. Summary

This updated requirement analysis reflects the integrated architecture of the project while also respecting the current state of the V2 API. Team V1 treats V2 as the official communication point for both input and output. V1 reads measurements from V2 and sends recommendation/results back to V2.

For Generation 1, V1 will use the current deployed V2 API with `jointAngles`, `isCorrect`, `timestamp`, and `sessionId`. The latest alignment clarifies that the patient uploads two angle values, and these values are available inside `jointAngles`. V1 uses these two angle values as input and generates a plain-text recommendation through `POST /recommendations` when supported by V2.

For a future generation, V1 will prepare for the richer `targetAngles + sensorData + errors` format. That future version can support a more complete IMU-based AI pipeline, but it depends on complete data, sensor mapping, labels, agreed semantics, and V2 schema support.

This update keeps the removal of the previous direct S2 -> V1 assumption. S2 remains an important upstream source of data definitions, but V1 should not implement direct communication with S2 in the integrated system.
