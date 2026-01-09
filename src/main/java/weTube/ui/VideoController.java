package weTube.ui;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import weTube.application.VideoDTO;
import weTube.application.VideoService;

import java.util.List;
import java.util.Optional;

@Controller
public class VideoController {
    private final VideoService videoService;
    public VideoController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/video")
    public ModelAndView showVideoPage(@RequestParam(required = false) Long id) {
        ModelAndView modelAndView = new ModelAndView("video");

        if (id != null) {
            Optional<VideoDTO> currentVideo = videoService.findById(id);
            currentVideo.ifPresent(video -> modelAndView.addObject("currentVideo", video));
        }

        List<VideoDTO> randomVideos = videoService.findAllRandom();
        modelAndView.addObject("videos", randomVideos);

        return modelAndView;
    }
}