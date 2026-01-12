package weTube.ui;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;
import weTube.application.VideoDTO;
import weTube.application.VideoService;

import java.util.List;

@Controller
public class HomeController {
    private final VideoService videoService;
    public HomeController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/home")
    public ModelAndView showHomePage() {
        List<VideoDTO> videos = videoService.findAllRandom();
        ModelAndView modelAndView = new ModelAndView("home");
        modelAndView.addObject("videos", videos);
        return modelAndView;
    }

    @GetMapping("/")
    public String redirectToHomePage() {
        return "redirect:/home";
    }
}