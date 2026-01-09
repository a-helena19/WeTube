package weTube.application;

import org.springframework.stereotype.Service;
import weTube.domain.Video;
import weTube.domain.VideoRepository;
import java.util.List;
import java.util.Optional;

@Service
public class VideoService {
    private final VideoRepository videoRepository;

    public VideoService(VideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    public List<Video> findAll() {
        return videoRepository.findAll();
    }

    public List<Video> findAllRandom() {
        return videoRepository.findAllRandom();
    }
    public Optional<Video> findById(Long id) {
        return videoRepository.findById(id);
    }
}

