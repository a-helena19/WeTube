package weTube.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VideoJpaRepository extends JpaRepository<VideoEntity, Long> {
    @Query(value = "SELECT * FROM video ORDER BY RANDOM()", nativeQuery = true)
    List<VideoEntity> findAllRandom();

    @Query(value = "SELECT * FROM video WHERE LOWER(title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(creator_name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY RANDOM()", nativeQuery = true)
    List<VideoEntity> searchByQuery(String query);
}

