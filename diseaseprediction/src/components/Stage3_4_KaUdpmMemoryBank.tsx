import React from 'react';
import {
  Stage3HierarchicalPatternResult,
  Stage3_3_SignatureResult,
} from '../types';
import { Stage3_4_XgbPrediction } from './Stage3_4_XgbPrediction';

interface Stage3_4_KaUdpmMemoryBankProps {
  patternResult: Stage3HierarchicalPatternResult;
  signatureResult: Stage3_3_SignatureResult;
  onNavigateToStage?: (stage: any) => void;
}

export const Stage3_4_KaUdpmMemoryBank: React.FC<Stage3_4_KaUdpmMemoryBankProps> = ({
  patternResult,
  signatureResult,
  onNavigateToStage,
}) => {
  return (
    <Stage3_4_XgbPrediction
      patternResult={patternResult}
      signatureResult={signatureResult}
      onNavigateToStage={onNavigateToStage}
    />
  );
};
