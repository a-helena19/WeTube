package weTube.presentation;

import org.springframework.web.bind.annotation.*;
import weTube.application.VideoService;
import weTube.domain.Video;

import java.util.List;

@RestController
@RequestMapping("/api/videos")
@CrossOrigin(origins = "http://localhost:8070") // Frontend port
public class WeTubeRestController {

    private final VideoService videoService;

    public WeTubeRestController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping
    public List<Video> getAllVideos() {
        return videoService.findAll();
    }

    @GetMapping("/{id}")
    public Video getVideoById(@PathVariable Long id) {
        return videoService.findById(id).orElse(null);
    }

    @PostMapping
    public Video createVideo(@RequestBody Video video) {
        return videoService.create(video);
    }
}