import styled, { css } from 'styled-components';

export const SummaryWrapper = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align:center;
  overflow: hidden;
`;

export const CurrentValueWrapper = styled.div<{ color: string }>`
  font-size: 120px;
  white-space: nowrap;
  ${props => {
    return css`
      color: ${props.color};  
    `;
  }};
`;

export const FormWrapper = styled.div<{ openSetting: boolean, readOnly: boolean }>`
  border-left: 1px solid var(--borderCommonDefault);
  width: 320px;
  flex-shrink: 0;
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
  display: ${(props) => props.openSetting ? 'block' : 'none'};
  ${(props) => {
    if (props.readOnly) {
      return css`
        pointer-events: none;
        opacity: 0.5;
      `;
    }
    return;
  }}
`;