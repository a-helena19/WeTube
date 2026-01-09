package weTube.infrastructure;
import jakarta.persistence.*;
import org.hibernate.validator.constraints.UUID;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
@Table(name = "video")
public class VideoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cloudinary_url", nullable = false)
    private String cloudinaryUrl;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "creator_name")
    private String creatorName;

    @Column(name = "creator_avatar_url")
    private String creatorAvatarUrl;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public VideoEntity() {}

    public VideoEntity(Long id, String title, String description, String cloudinaryUrl,
                       String thumbnailUrl, String creatorName, String creatorAvatarUrl,
                       Integer durationSeconds, Integer viewCount, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.cloudinaryUrl = cloudinaryUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.creatorName = creatorName;
        this.creatorAvatarUrl = creatorAvatarUrl;
        this.durationSeconds = durationSeconds;
        this.viewCount = viewCount;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCloudinaryUrl() {
        return cloudinaryUrl;
    }

    public void setCloudinaryUrl(String cloudinaryUrl) {
        this.cloudinaryUrl = cloudinaryUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public String getCreatorAvatarUrl() {
        return creatorAvatarUrl;
    }

    public void setCreatorAvatarUrl(String creatorAvatarUrl) {
        this.creatorAvatarUrl = creatorAvatarUrl;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}