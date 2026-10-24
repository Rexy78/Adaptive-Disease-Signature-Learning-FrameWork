# Clinical Data Discovery Engine & Multimorbidity Prediction Platform

A full-stack, standalone clinical analytics and disease prediction web application for modeling multimorbidity across Type 2 Diabetes, Cardiovascular Disease, and Chronic Kidney Disease.

## Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Recharts, Lucide Icons
- **Backend**: Node.js, Express, Vite, MongoDB / Mongoose (with in-memory persistence fallback)
- **Analytics Kernel**: Python 3.10 Clinical Risk & Counterfactual Engine
- **Modules**:
  1. **Dataset & Preprocessing Hub**: Cohort ingestion, KNN/Median imputation, range validation
  2. **Feature Discovery Matrix**: Unified multi-disease feature relevance & confusion metrics
  3. **Knowledge & Interaction Learning**: 570 pairwise interactions, 12 hierarchical patterns, KA-UDPM Memory Bank
  4. **Disease Progression & Future Risk**: 5-Year risk trajectory, complication hazard matrix, counterfactual what-if simulation

## Run Locally

**Prerequisites:** Node.js (v18+) and npm

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the web application:
   ```bash
   npm run dev
   ```

3. Open your browser:
   - Web App: `http://localhost:3000`
   - API Health: `http://localhost:3000/api/health`
