package weTube.application;

import org.springframework.stereotype.Service;
import weTube.domain.Video;
import weTube.domain.VideoRepository;
import weTube.infrastructure.VideoEntity;

@Service
public class VideoService {
    private final VideoRepository videoRepository;

    public VideoService(VideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    public Video create(Video video) {
        return videoRepository.save(video);
    }
}

