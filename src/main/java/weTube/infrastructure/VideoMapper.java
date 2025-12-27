package weTube.infrastructure;

import weTube.domain.Video;

public class VideoMapper {

    private VideoMapper() {}

    public static VideoEntity toEntity(Video video) {
        VideoEntity e = new VideoEntity();
        e.setId(video.getId());
        e.setTitle(video.getTitle());
        e.setDescription(video.getDescription());
        e.setCloudinaryUrl(video.getVideoUrl());
        e.setThumbnailUrl(video.getThumbnailUrl());
        e.setCreatorName(video.getCreatorName());
        e.setCreatorAvatarUrl(video.getCreatorAvatarUrl());
        e.setDurationSeconds(video.getDurationSeconds());
        e.setViewCount(video.getViewCount());
        e.setCreatedAt(video.getCreatedAt());
        return e;
    }

    public static Video toDomain(VideoEntity e) {
        return new Video(
                e.getId(),
                e.getTitle(),
                e.getDescription(),
                e.getCloudinaryUrl(),
                e.getThumbnailUrl(),
                e.getCreatorName(),
                e.getCreatorAvatarUrl(),
                e.getDurationSeconds(),
                e.getViewCount(),
                e.getCreatedAt()
        );
    }
}
