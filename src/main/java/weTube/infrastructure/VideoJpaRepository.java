package weTube.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoJpaRepository extends JpaRepository<VideoEntity, Long> {
}

