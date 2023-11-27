import { WidgetProps } from "@rjsf/core";
import {
  applyDefaultTheme,
  ITheme,
  Select,
  useTheme,
} from "@apitable/components";
import { FieldType, t, useField, FieldIconMap } from "@apitable/widget-sdk";
import React from "react";
import styled from "styled-components";
import { Strings } from "../i18n";

const SELECT_OPEN_SEARCH_COUNT = 7;

const transformOptions = (
  enumOptions: { label: string; value: any }[],
  theme: ITheme,
) => {
  return enumOptions.map((option) => {
    const res = {
      label: option.label,
      value: option.value,
    };
    const field = useField(option.value);
    if (!field) return res;
    const FieldIcon = FieldIconMap[field.type];
    return {
      ...res,
      prefixIcon: FieldIcon ? (
        <FieldIcon color={theme.palette.text.third} />
      ) : (
        ""
      ),
    };
  });
};

const ErrorText = styled.div.attrs(applyDefaultTheme)`
  font-size: 10px;
  padding: 4px 0 0 8px;
  color: ${(props) => props.theme.palette.danger};
`;

export const FieldSelect = ({
  options: { enumOptions },
  value: fieldId,
  onChange,
  rawErrors,
}: WidgetProps) => {
  const theme = useTheme();
  const field = useField(fieldId);
  const _options = transformOptions(enumOptions as any, theme as ITheme, field);
  // Errors in field selection, only if the selected field is deleted.
  const hasError = Boolean(rawErrors?.length);
  const style = hasError
    ? { border: "1px solid red", width: "100%" }
    : { width: "100%" };
  return (
    <>
      <Select
        placeholder={t(Strings.pick_one_option)}
        options={_options}
        value={fieldId}
        triggerStyle={style}
        onSelected={(option) => {
          onChange(option.value);
        }}
        dropdownMatchSelectWidth
        openSearch={_options.length > SELECT_OPEN_SEARCH_COUNT}
        searchPlaceholder={t(Strings.search)}
        noDataTip={t(Strings.empty_data)}
      />
      {hasError && (
        <ErrorText>{t(Strings.chart_option_field_had_been_deleted)}</ErrorText>
      )}
    </>
  );
};
