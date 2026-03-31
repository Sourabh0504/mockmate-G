# MockMate AI — Research Paper Diagrams

> This file contains all Mermaid textual diagrams used in the research paper.
> Use these to regenerate or edit diagrams in any Mermaid-compatible tool.

---

## Figure 1: Session Initialization Workflow

```mermaid
graph TD
    classDef user fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff,rx:10px,ry:10px;
    classDef backend fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff,rx:10px,ry:10px;
    classDef llm fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,rx:10px,ry:10px;
    classDef db fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,rx:10px,ry:10px;
    
    subgraph "Phase 1: Asynchronous Client Upload"
        A[Candidate Uploads:<br/>Resume PDF & JD Text]:::user
    end

    subgraph "Phase 2: Backend Validation & Orchestration"
        B[FastAPI Main Router]:::backend
        C[Gemini Extraction Parser]:::llm
        E[Gemini JD Semantic Analyzer]:::llm
        F[Dynamic Question Generator]:::llm
    end

    subgraph "Phase 3: Database Temporal Persistence"
        D[(JSON Resume Array)]:::db
        I[(Session State Matrix)]:::db
    end

    A -->|Auth Token & Form Data| B
    B -->|Base64 Encoded PDF Array| C
    C -->|Fuzzy Match Education & Projects| D
    B -->|Raw Unstructured JD Text| E
    E -->|JD Complexity Quality Score| F
    F -->|35% Allocation| G((Module 1:<br/>Historical Resume Verification)):::llm
    F -->|65% Allocation| H((Module 2/3:<br/>Core JD Competency Test)):::llm
    G --> I
    H --> I
    I -->|Secure Handshake Prepared| J[Target WebSocket Acquired]:::user
```

---

## Figure 2: Real-Time Voice Pipeline Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor C as Candidate (Browser)
    participant W as FastAPI WebSocket
    participant STT as Vosk STT Engine
    participant S as Telemetry (Pace & Silence)
    participant LLM as Gemini Generative Mode
    participant TTS as Edge-TTS Synthesis

    C->>W: Stream Audio (16kHz PCM, 100ms Chunks)
    activate W
    loop Active Listening Mode
        W->>STT: Direct Pipe Binary PCM
        STT-->>W: Yield Text Tokens (Including Fillers)
    end
    
    Note over C,S: Energy Threshold triggers 7-Second Silence
    
    W->>S: Halt Processing & Finalize Transcript Array
    W->>LLM: Pass Chunk via generateContent API
    activate LLM
    LLM-->>W: Stream Natural Text Response Follow-up
    deactivate LLM
    
    W->>TTS: Stream Text Chunks via Async Loop
    activate TTS
    TTS-->>W: Translate into Spoken Audio Bytes
    deactivate TTS
    
    W->>C: Push Audio Bytes down WebSocket
    deactivate W
    Note over C,W: Local Audio Buffers Flushed (Zero Data Retention)
```

---

## Figure 3: Database Entity-Relationship Model

```mermaid
erDiagram
    USERS ||--o{ RESUMES : "Uploads (FIFO Max 5)"
    USERS ||--o{ SESSIONS : "Administrates"
    SESSIONS ||--|| QUESTION_BANK : "Executes Linearly"
    SESSIONS ||--|| FEEDBACK_REPORT : "Generates Post-Interview"
    SESSIONS }|--|| RESUMES : "Locks Immutable Snapshot"

    USERS {
        ObjectId _id PK
        string email UK
        string bcrypt_password_hash
        date created_at
    }
    
    RESUMES {
        ObjectId _id PK
        ObjectId user_id FK
        json structured_data "Contains Edu, Work, Projects"
        int fifo_index "Queue Position: 0-4"
        date uploaded_at
    }
    
    SESSIONS {
        ObjectId _id PK
        ObjectId user_id FK
        string status "ACTIVE | COMPLETED"
        int difficulty_multiplier "1-10 Algorithmic Scale"
        string role_classification "Technical | Managerial"
        json session_transcript "Array of Temporal Q&A Pairs"
        json hybrid_evaluation_metrics "70% AI / 30% Deterministic"
    }

    FEEDBACK_REPORT {
        json per_question_scores "Individual Q Hybrid Scores"
        json dimension_aggregates "5 Skill Dimensions"
        json corrected_transcript "Spell-Fixed with Fillers Preserved"
        json ai_recommendations "Targeted Improvement Suggestions"
        float overall_score "Weighted Final 0-100"
    }
```

---

## Figure 4: Feedback Report Generation Pipeline

```mermaid
graph TD
    classDef processing fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff,rx:10px,ry:10px;
    classDef scoring fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,rx:10px,ry:10px;
    classDef output fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,rx:10px,ry:10px;
    classDef user fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff,rx:10px,ry:10px;

    subgraph "Stage 1: Per-Question Hybrid Scoring"
        A[Session Transcript Array]:::processing
        B[Gemini Qualitative Evaluator]:::scoring
        C[Deterministic Rule Engine]:::scoring
        D[Per-Question Blended Score]:::scoring
    end

    subgraph "Stage 2: Dimensional Aggregation"
        E[Tech Knowledge]:::output
        F[Communication]:::output
        G[Problem Solving]:::output
        H[Leadership]:::output
        I[Cultural Fit]:::output
        J[Overall Score: 0-100]:::output
    end

    subgraph "Stage 3: AI Coaching Engine"
        K[Gemini Recommendation Prompt]:::scoring
        L[Targeted Improvement Tips]:::scoring
    end

    subgraph "Final Report Delivery"
        M[(MongoDB Session Document)]:::processing
        N[Dashboard Report Modal]:::user
        O[PDF Export]:::user
    end

    A -->|Each Q-A Pair| B
    A -->|Speech Rate and Fillers| C
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    D --> I
    E & F & G & H & I --> J
    J --> K
    D --> K
    K --> L
    J --> M
    L --> M
    M --> N
    M --> O
```
