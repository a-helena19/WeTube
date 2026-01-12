package weTube.ui.util;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component("timeUtil")
public class TimeUtil {

    public String getTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "Unknown";
        }

        LocalDateTime now = LocalDateTime.now();
        Duration duration = Duration.between(dateTime, now);

        long minutes = duration.toMinutes();
        long hours = duration.toHours();
        long days = duration.toDays();
        long weeks = days / 7;
        long months = days / 30;
        long years = days / 365;

        if (minutes < 60) {
            return minutes + (minutes == 1 ? " minute ago" : " minutes ago");
        } else if (hours < 24) {
            return hours + (hours == 1 ? " hour ago" : " hours ago");
        } else if (days < 7) {
            return days + (days == 1 ? " day ago" : " days ago");
        } else if (weeks < 4) {
            return weeks + (weeks == 1 ? " week ago" : " weeks ago");
        } else if (months < 12) {
            return months + (months == 1 ? " month ago" : " months ago");
        } else {
            return years + (years == 1 ? " year ago" : " years ago");
        }
    }

    public String formatViewCount(Integer count) {
        if (count == null || count == 0) {
            return "0";
        }

        if (count >= 1_000_000) {
            double millions = count / 1_000_000.0;
            return String.format("%.1fM", millions);
        } else if (count >= 1_000) {
            double thousands = count / 1_000.0;
            return String.format("%.1fK", thousands);
        }
        return count.toString();
    }

    public String formatDuration(Integer durationSeconds) {
        if (durationSeconds == null || durationSeconds <= 0) {
            return "0:00";
        }

        int hours = durationSeconds / 3600;
        int minutes = (durationSeconds % 3600) / 60;
        int seconds = durationSeconds % 60;

        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, minutes, seconds);
        }
        return String.format("%d:%02d", minutes, seconds);
    }
}