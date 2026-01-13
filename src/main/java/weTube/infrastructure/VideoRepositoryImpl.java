package weTube.infrastructure;

import org.springframework.stereotype.Repository;
import weTube.domain.Video;
import weTube.domain.VideoRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class VideoRepositoryImpl implements VideoRepository {
    private final VideoJpaRepository jpaRepository;

    public VideoRepositoryImpl(VideoJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Video save(Video video) {
        VideoEntity entity = VideoMapper.toEntity(video);
        VideoEntity saved = jpaRepository.save(entity);
        return VideoMapper.toDomain(saved);
    }

    @Override
    public Optional<Video> findById(Long id) {
        Optional<VideoEntity> entityOpt = jpaRepository.findById(id);
        if (entityOpt.isPresent()) {
            VideoEntity entity = entityOpt.get();
            Video video = VideoMapper.toDomain(entity);
            return Optional.of(video);
        }
        return Optional.empty();
    }

    @Override
    public List<Video> findAll() {
        List<VideoEntity> entities = jpaRepository.findAll();
        List<Video> videos = new ArrayList<>();
        for (VideoEntity entity : entities) {
            Video video = VideoMapper.toDomain(entity);
            videos.add(video);
        }
        return videos;
    }

    @Override
    public List<Video> findAllRandom() {
        List<VideoEntity> entities = jpaRepository.findAllRandom();
        List<Video> videos = new ArrayList<>();
        for (VideoEntity entity : entities) {
            Video video = VideoMapper.toDomain(entity);
            videos.add(video);
        }
        return videos;
    }

    @Override
    public List<Video> searchByQuery(String query) {
        List<VideoEntity> entities = jpaRepository.searchByQuery(query);
        List<Video> videos = new ArrayList<>();
        for (VideoEntity entity : entities) {
            Video video = VideoMapper.toDomain(entity);
            videos.add(video);
        }
        return videos;
    }
}
