package weTube.application;

import org.springframework.stereotype.Service;
import weTube.domain.Video;
import weTube.domain.VideoRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VideoService {
    private final VideoRepository videoRepository;

    public VideoService(VideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    public List<VideoDTO> findAll() {
        List<Video> videos = videoRepository.findAll();
        List<VideoDTO> videoDTOs = new ArrayList<>();

        for (Video video : videos) {
            videoDTOs.add(toDTO(video));
        }
        return videoDTOs;
    }

    public List<VideoDTO> findAllRandom() {
        List<Video> videos = videoRepository.findAllRandom();
        List<VideoDTO> videoDTOs = new ArrayList<>();

        for (Video video : videos) {
            videoDTOs.add(toDTO(video));
        }
        return videoDTOs;
    }

    public List<VideoDTO> searchByQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return findAllRandom();
        }
        List<Video> videos = videoRepository.searchByQuery(query.trim());
        List<VideoDTO> videoDTOs = new ArrayList<>();

        for (Video video : videos) {
            videoDTOs.add(toDTO(video));
        }
        return videoDTOs;
    }

    public List<String> getSearchSuggestions(String query) {
        if (query == null || query.trim().isEmpty()) {
            return new ArrayList<>();
        }
        List<Video> videos = videoRepository.searchByQuery(query.trim());
        return videos.stream()
                .map(Video::getTitle)
                .distinct()
                .limit(8)
                .collect(Collectors.toList());
    }

    public Optional<VideoDTO> findById(Long id) {
        Optional<Video> videoOptional = videoRepository.findById(id);

        if (videoOptional.isPresent()) {
            return Optional.of(toDTO(videoOptional.get()));
        }
        return Optional.empty();
    }

    private VideoDTO toDTO(Video video) {
        return new VideoDTO(
                video.getId(),
                video.getTitle(),
                video.getDescription(),
                video.getVideoUrl(),
                video.getThumbnailUrl(),
                video.getCreatorName(),
                video.getCreatorAvatarUrl(),
                video.getDurationSeconds(),
                video.getViewCount(),
                video.getCreatedAt()
        );
    }
}

