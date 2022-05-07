import { initializeWidget } from '@vikadata/widget-sdk';
import { WidgetSummary } from './summary';

initializeWidget(WidgetSummary, process.env.WIDGET_PACKAGE_ID);
