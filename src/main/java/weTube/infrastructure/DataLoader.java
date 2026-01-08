package weTube.infrastructure;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import weTube.domain.Video;
import weTube.domain.VideoRepository;
import java.time.LocalDateTime;

@Component
public class DataLoader implements CommandLineRunner {

    private final VideoRepository videoRepository;

    public DataLoader(VideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if database is empty
        if (videoRepository.findAll().isEmpty()) {
            System.out.println("📊 Seeding database with sample videos...");

            Video video1 = new Video(
                    null,
                    "Big Buck Bunny",
                    "A large and lovable rabbit fights back against his tormentors",
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                    "https://peach.blender.org/wp-content/uploads/bbb-splash.png",
                    "Blender Foundation",
                    "https://via.placeholder.com/40",
                    596,
                    15000000,
                    LocalDateTime.now().minusDays(7)
            );

            Video video2 = new Video(
                    null,
                    "Elephant Dream",
                    "The first Blender Open Movie from 2006",
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/320px-Big_buck_bunny_poster_big.jpg",
                    "Orange Open Movie",
                    "https://via.placeholder.com/40",
                    653,
                    8900000,
                    LocalDateTime.now().minusDays(3)
            );

            videoRepository.save(video1);
            videoRepository.save(video2);

            System.out.println("✅ Added 2 sample videos to database");
        } else {
            System.out.println("✅ Database already has " + videoRepository.findAll().size() + " videos");
        }
    }
}