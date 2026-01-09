package weTube.ui;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;
import weTube.application.VideoService;
import weTube.domain.Video;

import java.util.List;

@Controller
public class HomeController {
    private final VideoService videoService;
    public HomeController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/home")
    public ModelAndView showHomePage() {
        List<Video> videos = videoService.findAllRandom();
        ModelAndView modelAndView = new ModelAndView("home");
        modelAndView.addObject("videos", videos);
        return modelAndView;
    }
}