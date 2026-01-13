package weTube.domain;

import java.util.List;
import java.util.Optional;

public interface VideoRepository {
    Video save(Video video);
    Optional<Video> findById(Long id);
    List<Video> findAll();
    List<Video> findAllRandom();
    List<Video> searchByQuery(String query);
}
