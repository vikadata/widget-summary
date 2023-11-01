import { WidgetProps } from '@rjsf/core';
import { applyDefaultTheme, ITheme, Select, useTheme } from '@apitable/components';
import { FieldType, t, useField } from '@apitable/widget-sdk';
import React from 'react';
import {
  ColumnAttachmentFilled,
  ColumnAutonumberFilled,
  AccountFilled,
  ColumnCheckboxFilled,
  ColumnLastmodifiedtimeFilled,
  ColumnTextFilled,
  ColumnCreatedbyFilled,
  ColumnCreatedtimeFilled,
  ColumnSingleFilled,
  ColumnCurrencyFilled,
  ColumnEmailFilled,
  ColumnFormulaFilled,
  ColumnPercentFilled,
  ColumnFigureFilled,
  ColumnMultipleFilled,
  ColumnCalendarFilled,
  ColumnLinktableFilled,
  ColumnUrlOutlined,
  ColumnLastmodifiedbyFilled,
  ColumnLongtextFilled,
  ColumnPhoneFilled,
  ColumnLookupFilled,
  ColumnRatingFilled,
  CascadeOutlined,
  OneWayLinkOutlined,
  TwoWayLinkOutlined
} from '@apitable/icons';
import styled from 'styled-components';
import { Strings } from '../i18n';

const SELECT_OPEN_SEARCH_COUNT = 7;
const FieldIconMap = {
  [FieldType.Text]: ColumnLongtextFilled, // FIXME: icon
  [FieldType.Number]: ColumnFigureFilled, // FIXME: icon there is a problem with the naming.
  [FieldType.SingleSelect]: ColumnSingleFilled,
  [FieldType.MultiSelect]: ColumnMultipleFilled,
  [FieldType.DateTime]: ColumnCalendarFilled, // FIXME: icon there is a problem with the naming.
  [FieldType.Attachment]: ColumnAttachmentFilled,
  [FieldType.OneWayLink]: OneWayLinkOutlined,
  [FieldType.TwoWayLink]: TwoWayLinkOutlined,
  [FieldType.MagicLink]: ColumnLinktableFilled, // ?
  [FieldType.URL]: ColumnUrlOutlined,
  [FieldType.Email]: ColumnEmailFilled,
  [FieldType.Phone]: ColumnPhoneFilled,
  [FieldType.Checkbox]: ColumnCheckboxFilled,
  [FieldType.Rating]: ColumnRatingFilled,
  [FieldType.Member]: AccountFilled,
  [FieldType.MagicLookUp]: ColumnLookupFilled,
  [FieldType.Formula]: ColumnFormulaFilled,
  [FieldType.Currency]: ColumnCurrencyFilled,
  [FieldType.Percent]: ColumnPercentFilled,
  [FieldType.SingleText]: ColumnTextFilled,
  [FieldType.AutoNumber]: ColumnAutonumberFilled,
  [FieldType.CreatedTime]: ColumnCreatedtimeFilled,
  [FieldType.LastModifiedTime]: ColumnLastmodifiedtimeFilled,
  [FieldType.CreatedBy]: ColumnCreatedbyFilled,
  [FieldType.LastModifiedBy]: ColumnLastmodifiedbyFilled,
  [FieldType.Cascader]: CascadeOutlined
};

const transformOptions = (enumOptions: { label: string, value: any }[], theme: ITheme) => {

  return enumOptions.map(option => {
    const res = {
      label: option.label,
      value: option.value,
    };
    const field = useField(option.value);
    if (!field) return res;
    const FieldIcon = FieldIconMap[field.type];
    return {
      ...res,
      prefixIcon: FieldIcon ? <FieldIcon color={theme.palette.text.third} /> : null,
    };
  });
};

const ErrorText = styled.div.attrs(applyDefaultTheme)`
  font-size: 10px;
  padding: 4px 0 0 8px;
  color: ${(props) => props.theme.palette.danger};
`;

export const FieldSelect = ({ options: { enumOptions }, value: fieldId, onChange, rawErrors }: WidgetProps) => {
  const theme = useTheme();
  const field = useField(fieldId);
  const _options = transformOptions(enumOptions as any, theme as ITheme, field);
  // Errors in field selection, only if the selected field is deleted.
  const hasError = Boolean(rawErrors?.length);
  const style = hasError ? { border: '1px solid red', width: '100%' } : { width: '100%' };
  return <>
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
    {
      hasError && <ErrorText>{t(Strings.chart_option_field_had_been_deleted)}</ErrorText>
    }
  </>;
};
