package weTube.ui;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import weTube.application.VideoDTO;
import weTube.application.VideoService;

import java.util.List;

@RestController
@RequestMapping("/api")
public class WeTubeRestcontroller {

    private final VideoService videoService;

    public WeTubeRestcontroller(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/videos")
    public List<VideoDTO> getAllVideos() {
        return videoService.findAll();
    }

    @GetMapping("/search/suggestions")
    public List<String> getSearchSuggestions(@RequestParam(value = "q", required = false) String query) {
        return videoService.getSearchSuggestions(query);
    }
}