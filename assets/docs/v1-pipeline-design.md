# Team V1 — AI & Motion Recognition Pipeline Design

**Project:** DSD 2025–2026 · UTAD × Jilin University  
**Team:** V1 — AI & Motion Recognition  
**Version:** v0.1  
**Purpose:** Define the first technical design of the V1 preprocessing and AI pipeline based on the data, analysis reports, S2 explanations, and current project context collected so far.

---

## 1. Executive Summary

Team V1 can already start designing and implementing the preprocessing pipeline.

The current data format is compatible with a first AI-oriented workflow because it includes:

- `sensorData`: IMU sensor readings from two sensors;
- `targetAngles`: joint angles computed by Team S2;
- `errors`: sensor or validation error events;
- `sessionId`: session identifier.

However, the current data is not yet sufficient for a complete clinical AI model. The first realistic model should be an **angle regression model**, not a correctness classifier.

The recommended first task is:

```text
Synchronized IMU sensor data → predicted left_knee angle
```

In other words:

```text
Input X  = time windows of synchronized IMU data
Output Y = left_knee angle computed by S2
```

The pipeline should be built in a modular way so that it can later support:

- patient ID;
- exercise type;
- sensor-to-body-segment mapping;
- repetition ID;
- clinical labels;
- doctor validation;
- movement quality classification;
- recommendation generation.

---

## 2. Current Understanding of the Data

### 2.1 Main JSON Structure

The current data is expected to follow this general structure:

```json
{
  "sessionId": 30,
  "targetAngles": [],
  "sensorData": [],
  "errors": []
}
```

A future version may include a `sessionContext` object, but this is not currently confirmed as part of the stable payload.

---

### 2.2 `sensorData`

`sensorData` is the main input source for V1.

It contains validated IMU readings from the sensors.

Each sample represents the state of one sensor at one timestamp.

Expected fields:

```json
{
  "timestamp": 1778223184597,
  "sensorId": "SIM_SENSOR_A",
  "accX": 0.2266,
  "accY": 0.2915,
  "accZ": 0.9668,
  "gyroX": 0.0,
  "gyroY": 3.11,
  "gyroZ": -0.73,
  "roll": 15.57,
  "pitch": -13.78,
  "yaw": -144.01
}
```

### Intuition

`sensorData` is the raw movement information.

It tells us how each IMU sensor moved over time. The model will not directly see a human leg; it will only see numerical signals from sensors attached to the body.

The AI model must learn patterns from these signals.

---

### 2.3 Meaning of Each Sensor Feature

| Field | Meaning | Unit | Usefulness for V1 |
|---|---|---:|---|
| `accX` | acceleration on X axis | g | movement intensity and direction |
| `accY` | acceleration on Y axis | g | movement intensity and direction |
| `accZ` | acceleration on Z axis | g | gravity/orientation-related signal |
| `gyroX` | angular velocity on X axis | deg/s | rotation speed |
| `gyroY` | angular velocity on Y axis | deg/s | rotation speed |
| `gyroZ` | angular velocity on Z axis | deg/s | rotation speed |
| `roll` | orientation angle | degrees | very important for angle estimation |
| `pitch` | orientation angle | degrees | very important for angle estimation |
| `yaw` | orientation angle | degrees | useful but potentially unstable |

---

### 2.4 `targetAngles`

`targetAngles` are not clinical prescribed angles.

Based on the S2 explanation, they are **joint angles computed by the S2 core** from two IMU sensors.

Example:

```json
{
  "timestamp": 1778223184597,
  "angleID": "left_knee",
  "angle": 45.2
}
```

This means:

```text
At this timestamp, S2 computed that the left knee angle was 45.2 degrees.
```

### Intuition

The name `targetAngles` can be confusing.

For V1, it is safer to interpret this field internally as:

```text
measured_joint_angle
```

or:

```text
s2_computed_joint_angle
```

It is a measured/computed value, not necessarily a medical target prescribed by the doctor.

---

### 2.5 `errors`

`errors` contains error events from sensors, validation, or timeouts.

Example:

```json
{
  "timestamp": 1778223184597,
  "sensorId": "SIM_SENSOR_A",
  "errorType": "sensor_disconnected",
  "message": "Sensor disconnected during session"
}
```

### Intuition

Errors are important because they help V1 know whether parts of the session are trustworthy.

A model should not blindly learn from corrupted or incomplete data.

---

## 3. Important Context from S2

Team S2 explained that:

- two sensors are used to calculate a joint angle;
- roll, pitch and yaw represent the orientation of the IMU in space;
- the angle between the normal vectors of two IMUs can be used to compute the joint angle;
- there were practical issues with yaw distortion;
- the measurement process may include:
  - leg extension;
  - holding the extended position;
  - leg flexion;
  - holding the flexed position;
  - irrelevant fluctuations while the patient is wearing the device.

This means V1 must treat the data as **time-series movement data**, not as isolated independent rows.

---

## 4. Current Assumptions

Until more information arrives from S2/V2, the pipeline should be designed with these assumptions:

| Assumption | Current Status |
|---|---|
| `targetAngles` are computed by S2 from IMU data | Confirmed by S2 |
| `targetAngles` are not prescribed clinical targets | Strongly implied |
| two sensors define one joint angle | Confirmed by S2 |
| sensor data can be asynchronous | Confirmed by S2 |
| yaw may be unstable/distorted | Confirmed by S2 |
| sensor-to-body-segment mapping is not yet available | Pending |
| patient ID is not yet in the current data | Pending / future |
| exercise type can be provided in the future | Confirmed as possible |
| clinical correctness labels are not provided by S2 | Confirmed |
| repetition ID does not currently exist | Pending / future |

---

## 5. High-Level Pipeline Overview

The proposed V1 pipeline is:

```text
Raw JSON from V2/S2
        ↓
Data ingestion
        ↓
Schema validation
        ↓
Session context parsing
        ↓
Sensor grouping
        ↓
Timestamp normalization
        ↓
Sensor synchronization / interpolation
        ↓
Long-to-wide conversion
        ↓
Feature engineering
        ↓
Target angle alignment
        ↓
Movement phase detection
        ↓
Window creation
        ↓
Feature normalization
        ↓
Baseline model
        ↓
Deep Learning model
        ↓
Post-processing
        ↓
Recommendation / analysis output
```

---

# 6. Detailed Pipeline Modules

---

## Module 1 — Data Ingestion

### Goal

Load raw JSON data received from V2/S2.

### Input

One or more JSON files containing:

```text
sessionId
sensorData
targetAngles
errors
```

### Output

A Python object or DataFrame representation of the sessions.

### Intuition

This module is the entry point of the pipeline.

Before V1 can do any AI work, it needs to reliably read the data.

The goal is not to understand the movement yet. The goal is only to bring the data into the program without losing information.

### Important Rules

- Do not modify the original JSON files.
- Support both single-session files and multiple-session files.
- Handle invalid JSON safely.
- Log files that could not be loaded.

---

## Module 2 — Schema Validation

### Goal

Check whether the data contains the expected structure and fields.

### Required Top-Level Fields

```text
sessionId
sensorData
targetAngles
errors
```

### Required `sensorData` Fields

```text
timestamp
sensorId or deviceId
accX, accY, accZ
gyroX, gyroY, gyroZ
roll, pitch, yaw
```

### Required `targetAngles` Fields

```text
timestamp
angleID
angle
```

### Output

A validation report containing:

- missing fields;
- invalid numeric values;
- invalid timestamps;
- empty lists;
- unexpected fields;
- invalid sessions.

### Intuition

This module is like checking whether all ingredients are present before cooking.

A model trained on broken data will produce unreliable results.

If a sensor sample is missing `roll`, for example, the model cannot interpret orientation correctly.

---

## Module 3 — Session Context Parsing

### Goal

Extract information that describes the session.

### Current Available Context

Currently, the data mostly contains:

```text
sessionId
```

### Desired Future Context

A future payload could include:

```json
{
  "sessionContext": {
    "sessionId": 30,
    "userId": 5,
    "payloadStatus": "bend_knee_10",
    "sensorJointMapping": {
      "sensor_A": {
        "joint": "left_knee",
        "bodySegment": "thigh"
      },
      "sensor_B": {
        "joint": "left_knee",
        "bodySegment": "shank"
      }
    }
  }
}
```

### Why This Matters

For V1, this context is very important.

Without it, the model may know that there are two sensors, but not what each sensor means anatomically.

### Intuition

The session context is the identity card of the recording.

It answers questions such as:

- Who performed the movement?
- What exercise was performed?
- Which joint is being measured?
- Which sensor was placed on which body segment?

Without this context, the data is only numbers.

---

## Module 4 — Sensor Grouping

### Goal

Separate `sensorData` by sensor.

### Example

Original long format:

```text
timestamp | sensorId     | accX | accY | ...
1000      | SIM_SENSOR_A | ...  | ...  |
1000      | SIM_SENSOR_B | ...  | ...  |
1020      | SIM_SENSOR_A | ...  | ...  |
1020      | SIM_SENSOR_B | ...  | ...  |
```

After grouping:

```text
Sensor A timeline
Sensor B timeline
```

### Output

One ordered time-series per sensor.

### Intuition

Each sensor has its own story over time.

Before comparing two sensors, V1 must separate their timelines.

Only after that can we align them.

---

## Module 5 — Timestamp Normalization

### Goal

Convert all timestamps to a single internal format.

### Possible Input Formats

```text
Unix milliseconds
Unix seconds
ISO strings
```

### Recommended Internal Format

```text
timestamp_seconds as float
```

Example:

```text
1778223184597 ms → 1778223184.597 seconds
```

### Intuition

The model does not care if the timestamp came as an ISO string or Unix milliseconds.

It needs a consistent time scale.

This is especially important because sensor synchronization depends on precise time differences.

---

## Module 6 — Sensor Synchronization and Interpolation

### Goal

Align data from multiple sensors onto a common timeline.

### Why This Is Needed

S2 confirmed that sensors can be asynchronous.

This means sensor A and sensor B may not produce samples at the exact same timestamp.

Example:

```text
Sensor A: t = 0.00, 0.02, 0.04
Sensor B: t = 0.01, 0.03, 0.05
```

A model cannot directly compare these rows unless they are aligned.

### Possible Strategies

#### Strategy A — Nearest Sample

For each target timestamp, pick the closest sample from each sensor.

Good when sensors are already almost synchronized.

#### Strategy B — Linear Interpolation

Estimate sensor values at a desired timestamp by interpolating between two nearby samples.

Good when sensors are asynchronous but smooth.

#### Strategy C — Fixed-Rate Resampling

Create a new regular timeline, for example:

```text
20 Hz → one row every 0.05 seconds
```

Then interpolate all sensors onto that timeline.

### Current Recommendation

Use:

```text
20 Hz fixed-rate resampling
```

for the first general pipeline version.

### Intuition

The model needs a video-like sequence: one complete frame every fixed time step.

Sensor synchronization creates these frames.

Without synchronization, the model may compare sensor A at one moment with sensor B at a different moment.

---

## Module 7 — Long-to-Wide Conversion

### Goal

Convert sensor samples from long format into wide format.

### Long Format

```text
timestamp | sensorId | accX | accY | accZ | ...
```

### Wide Format

```text
timestamp | sensor_0_accX | sensor_0_accY | ... | sensor_1_accX | sensor_1_accY | ...
```

### Example

```text
timestamp | sensor_0_roll | sensor_0_pitch | sensor_1_roll | sensor_1_pitch | target_left_knee
1000.00   | 31.6          | 25.4           | 21.8          | 17.4           | 12.1
1000.05   | 35.2          | 28.1           | 14.8          | 11.7           | 25.3
```

### Intuition

In long format, each row represents one sensor.

In wide format, each row represents the full body state at one moment.

The model needs the full body state, not isolated sensor rows.

---

## Module 8 — Feature Engineering

### Goal

Create additional useful variables from the raw IMU signals.

### Base Features

For each sensor:

```text
accX, accY, accZ
gyroX, gyroY, gyroZ
roll, pitch, yaw
```

With two sensors:

```text
2 sensors × 9 features = 18 base features
```

### Recommended Derived Features

#### Acceleration Magnitude

```text
acc_mag = sqrt(accX² + accY² + accZ²)
```

Intuition: tells how strong the total acceleration is, independently of axis direction.

#### Gyroscope Magnitude

```text
gyro_mag = sqrt(gyroX² + gyroY² + gyroZ²)
```

Intuition: tells how intense the rotation is.

#### Circular Encoding for Yaw

```text
sin_yaw = sin(yaw)
cos_yaw = cos(yaw)
```

Intuition: avoids the -180/+180 discontinuity.

For example:

```text
179° and -179° are almost the same direction,
but numerically they look very far apart.
```

#### Orientation Differences Between Sensors

```text
roll_diff = roll_sensor_0 - roll_sensor_1
pitch_diff = pitch_sensor_0 - pitch_sensor_1
yaw_diff = circular_difference(yaw_sensor_0, yaw_sensor_1)
```

Intuition: joint angles are related to the difference between the orientations of two body segments.

If one sensor is on the thigh and the other is on the shank, their orientation difference is directly related to knee flexion.

---

## Module 9 — Target Angle Alignment

### Goal

Align `targetAngles` with synchronized sensor rows.

### Input

```text
synchronized sensor timeline
targetAngles timeline
```

### Output

```text
timestamp | synchronized sensor features | target_left_knee
```

### Alignment Options

- exact timestamp match;
- nearest timestamp;
- interpolation;
- resampling to common timeline.

### Intuition

For supervised learning, every input must have a target.

The model needs examples of:

```text
When the sensors looked like this, the knee angle was this.
```

---

## Module 10 — Movement Phase Detection

### Goal

Detect useful and non-useful parts of the session.

### Expected Phases

Based on S2/M2 explanation, a session may include:

```text
extension hold
flexion movement
flexion hold
fluctuation / irrelevant movement
```

### Possible Detection Signals

Use the `left_knee` angle curve:

```text
angle(t)
angle velocity = derivative of angle over time
min angle region
max angle region
low-velocity plateaus
large unstable fluctuations
```

### Example Heuristics

- low angle + low velocity → flexion or extension hold depending on definition;
- increasing angle rapidly → flexion movement;
- stable high angle → hold phase;
- unstable short oscillations → fluctuation.

### Intuition

Not every part of a recording is useful for training.

If the patient moves randomly while wearing the device, those samples may confuse the model.

Phase detection helps mark or remove those parts.

---

## Module 11 — Window Creation

### Goal

Convert the time-series into fixed-size windows for model training.

### Why Windows Are Needed

A single timestamp is not enough to understand movement.

A model should see a short sequence of motion.

### Recommended First Configuration

```text
sampling_rate = 20 Hz
window_size = 1 second
timesteps = 20
overlap = 50%
```

### Input Tensor

```text
X = (n_windows, timesteps, n_features)
```

Example:

```text
X = (n_windows, 20, 18)
```

if using 2 sensors × 9 base features.

### Output Target

Option A:

```text
y = angle at the center of the window
```

Option B:

```text
y = angle at the last timestamp of the window
```

### Recommended First Choice

Use:

```text
y = angle at the center of the window
```

### Intuition

A window is like a short video clip.

The model sees a small movement segment and learns to predict the joint angle associated with that segment.

---

## Module 12 — Feature Normalization

### Goal

Put all features on a comparable numerical scale.

### Why This Matters

Different features have different ranges.

Example:

```text
accX may be around -1 to 1
gyroX may be hundreds of deg/s
roll may be -180 to 180
```

If values are not normalized, the model may focus too much on features with larger numerical ranges.

### Recommended Approach

Use standardization:

```text
x_normalized = (x - mean) / std
```

### Important Rule

Fit the scaler only on training data.

Then apply the same scaler to validation/test data.

### Intuition

Normalization makes the learning problem easier.

It lets the model compare features more fairly.

---

## Module 13 — Baseline Models

### Goal

Build simple reference models before deep learning.

### Why Baselines Are Important

A complex model is not useful if a simple method already performs well.

Baselines help answer:

```text
Is the data useful?
Is the pipeline working?
Is deep learning really needed?
```

---

### Baseline 1 — Rule-Based / Geometric Approximation

Use orientation differences between sensors to approximate the joint angle.

Example features:

```text
roll_diff
pitch_diff
yaw_diff
```

### Intuition

S2 already computes joint angles using two sensors.

V1 should first check whether a simple geometric approximation can reproduce the `targetAngles`.

This requires no training.

---

### Baseline 2 — Classical Regression

Use engineered features per window:

```text
mean
std
min
max
range
last value
```

Possible models:

```text
Linear Regression
Ridge Regression
Random Forest
Gradient Boosting
```

### Intuition

Classical models are easier to debug and explain.

They are a good first step before neural networks.

---

### Baseline 3 — Simple MLP

Use aggregated window features as input.

Output:

```text
left_knee angle
```

### Intuition

This is the simplest neural network baseline.

It does not model the full temporal structure, but it can learn non-linear relationships.

---

## Module 14 — First Deep Learning Model

### Recommended First DL Model

Use a simple **1D CNN**.

### Input

```text
X = (n_windows, timesteps, features)
```

Example:

```text
X = (n_windows, 20, 18)
```

### Output

```text
predicted_left_knee_angle
```

### Why 1D CNN First?

A 1D CNN can detect short temporal patterns in sensor signals.

It is simpler than LSTM/GRU and usually easier to train with limited data.

### Intuition

A 1D CNN slides filters over time.

It can learn patterns such as:

- beginning of flexion;
- stable hold;
- sudden movement;
- oscillation;
- sensor noise.

---

## Module 15 — Future Deep Learning Models

### LSTM / GRU

Use only when there are more sessions and subjects.

### Transformer

Use only much later, if the dataset becomes large enough.

### Why Not Now?

Current data volume is too small.

Using complex models now increases the risk of overfitting.

### Intuition

A large model can memorize one session.

That is not real learning.

The first goal is a robust and explainable pipeline, not a complex architecture.

---

## Module 16 — Post-Processing

### Goal

Clean and interpret model outputs.

### Possible Steps

```text
smooth predicted angle curve
remove spikes
clip impossible values
calculate min angle
calculate max angle
calculate range of motion
calculate stability during hold
detect invalid sessions
```

### Intuition

A model output is not the final clinical information.

The raw prediction must be transformed into stable metrics.

---

## Module 17 — Recommendation / Analysis Output

### Goal

Send useful results back to V2/M2/doctor.

### Possible Output

```json
{
  "sessionId": 30,
  "angleID": "left_knee",
  "predictedMinAngle": 8.2,
  "predictedMaxAngle": 121.4,
  "rangeOfMotion": 113.2,
  "movementStatus": "valid_measurement",
  "confidence": 0.82,
  "recommendationText": "The patient reached a high knee flexion range during the session."
}
```

### Intuition

V1 should not return only raw model numbers.

It should convert movement analysis into structured and understandable information.

---

# 7. Model Input / Output Design

## 7.1 Recommended First Task

```text
Task: angle regression
```

The model predicts:

```text
left_knee angle
```

from synchronized IMU windows.

---

## 7.2 Input X

### Base Input

```text
sensor_0_accX
sensor_0_accY
sensor_0_accZ
sensor_0_gyroX
sensor_0_gyroY
sensor_0_gyroZ
sensor_0_roll
sensor_0_pitch
sensor_0_yaw

sensor_1_accX
sensor_1_accY
sensor_1_accZ
sensor_1_gyroX
sensor_1_gyroY
sensor_1_gyroZ
sensor_1_roll
sensor_1_pitch
sensor_1_yaw
```

### Shape

```text
X = (n_windows, timesteps, n_features)
```

With 2 sensors and 9 base features:

```text
n_features = 18
```

Example:

```text
X = (n_windows, 20, 18)
```

for 1-second windows at 20 Hz.

---

## 7.3 Output Y

Recommended first output:

```text
y = left_knee angle
```

Possible target definition:

```text
angle at center timestamp of the window
```

---

## 7.4 Future Outputs

Later, V1 may output:

```text
movement correctness
movement quality score
phase label
range of motion
min/max angle
recommendation text
clinical warning
```

But these require additional labels or clinical validation.

---

# 8. What V1 Should Not Do Yet

V1 should not yet:

- train a correct/incorrect classifier;
- claim clinical decision-making;
- assume `targetAngles` are prescribed targets;
- mix real and virtual data blindly;
- evaluate only on virtual/simulated data;
- build a complex LSTM/Transformer model with only a few sessions;
- ignore sensor synchronization;
- ignore yaw discontinuities;
- ignore sensor-to-body-segment mapping.

---

# 9. Current Blockers and Pending Clarifications

## 9.1 Sensor-to-Body Mapping

Still needed:

```text
Which sensor is on the thigh?
Which sensor is on the shank/lower leg?
Which two sensors define each angleID?
```

This is important for interpretability.

---

## 9.2 Session Context

Desired future fields:

```text
sessionId
userId
exercise type / payloadStatus
sensorJointMapping
body segment mapping
```

---

## 9.3 Repetition ID

A repetition ID would identify each individual movement repetition inside a session.

Example:

```text
sessionId = 30
repetitionId = 1 → first knee bend
repetitionId = 2 → second knee bend
```

This would help V1 compute metrics per repetition.

---

## 9.4 Clinical Labels

Needed for classification:

```text
isCorrect
movement quality
doctor validation
phase label
exercise success/failure
```

Without these, V1 should focus on regression and analysis, not classification.

---

# 10. Recommended Development Roadmap

## Phase 0 — Data Parser

Build a stable parser for:

```text
sensorData
targetAngles
errors
session metadata
```

Output:

```text
clean DataFrames
```

---

## Phase 1 — Synchronization Pipeline

Implement:

```text
sensor grouping
timestamp normalization
interpolation
resampling
wide-format conversion
```

Output:

```text
timestamp | sensor_0_features | sensor_1_features | target_left_knee
```

---

## Phase 2 — Feature Engineering

Add:

```text
acc magnitude
gyro magnitude
sin/cos yaw
orientation differences
```

---

## Phase 3 — Windowing

Create:

```text
X = (n_windows, timesteps, features)
y = angle target
```

---

## Phase 4 — Rule-Based Baseline

Compare S2 angle with simple orientation-difference formulas.

---

## Phase 5 — Classical ML Baseline

Train and evaluate:

```text
Linear Regression
Ridge
Random Forest
Gradient Boosting
```

---

## Phase 6 — Simple Neural Baseline

Train:

```text
MLP
1D CNN
```

only after the previous phases work.

---

## Phase 7 — Recommendation Layer

Convert predictions into:

```text
min angle
max angle
range of motion
movement status
recommendation text
```

---

# 11. Final Recommended Pipeline v0.1

```text
1. Load JSON from V2/S2
2. Validate schema
3. Parse session information
4. Group sensorData by sessionId and sensorId
5. Normalize timestamps
6. Synchronize sensors
7. Resample to fixed frequency
8. Convert long format to wide format
9. Add derived features
10. Align targetAngles
11. Detect movement phases
12. Create fixed-size windows
13. Normalize features
14. Train baseline regression models
15. Train simple 1D CNN only after baselines
16. Post-process predicted angles
17. Generate structured V1 output
```

---

# 12. Final Technical Position

Team V1 can already start implementing the pipeline.

The first model should be:

```text
left_knee angle regression from synchronized IMU data
```

This is not yet a full clinical AI model.

It is the first realistic step toward a complete V1 motion-recognition engine.

A complete model will require:

- more sessions;
- more users;
- exercise type;
- sensor-to-body mapping;
- repetition information;
- clinical labels;
- doctor validation;
- stronger evaluation.

---

# 13. Short Explanation for Meetings

Team V1 can now start the preprocessing pipeline using the current data format. The current JSON contains IMU sensor readings and S2-computed joint angles. The first realistic AI task is to predict the left knee angle from synchronized sensor windows. Before training a complete clinical model, V1 still needs more sessions, sensor placement information, exercise type, and clinical labels such as movement correctness or movement quality.
