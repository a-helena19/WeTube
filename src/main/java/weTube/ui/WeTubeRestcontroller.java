package weTube.ui;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import weTube.application.VideoService;
import weTube.domain.Video;

import java.util.List;

@RestController
@RequestMapping("/api")
public class WeTubeRestcontroller {

    private final VideoService videoService;

    public WeTubeRestcontroller(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/videos")
    public List<Video> getAllVideos() {
        return videoService.findAll();
    }
}