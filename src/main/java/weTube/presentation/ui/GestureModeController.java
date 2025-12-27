package weTube.presentation.ui;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.ui.Model;
import weTube.application.VideoService;

@Controller

public class GestureModeController {
    private final VideoService videoService;
    public GestureModeController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/gesture-mode")
    public String showGestureModePage(Model model) {
        model.addAttribute("videos", videoService.findAll());
        return "GestureMode";
    }
}