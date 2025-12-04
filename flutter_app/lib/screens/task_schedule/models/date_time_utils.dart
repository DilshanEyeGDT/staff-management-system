import 'package:intl/intl.dart';

class DateTimeUtils {
  static String formatDateTime(String utcString) {
    try {
      final utcTime = DateTime.parse(utcString).toUtc();
      final localTime = utcTime.toLocal();

      return DateFormat('dd MMM yyyy, h:mm a').format(localTime);
    } catch (e) {
      return utcString;
    }
  }
}
