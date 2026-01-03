package weTube.presentation.ui;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.ui.Model;
import weTube.application.VideoService;

@Controller

public class CursorModeController {
    private final VideoService videoService;

    public CursorModeController(VideoService videoService) {
        this.videoService = videoService;
    }
    @GetMapping("/cursor-mode")
    public String showCursorModePage(Model model) {
        model.addAttribute("videos", videoService.findAll());
        return "CursorMode"; // This should match the template name exactly
    }
}
