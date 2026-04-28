package com.finance.app.web.rest;

import com.finance.app.repository.UserRepository;
import com.finance.app.service.UserService;
import com.finance.app.service.dto.AdminUserDTO;
import com.finance.app.web.rest.errors.EmailAlreadyUsedException;
import com.finance.app.web.rest.errors.LoginAlreadyUsedException;
import com.finance.app.web.rest.vm.MobileTabSettingsVM;
import com.finance.app.web.rest.vm.RegisterVM;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AccountUserResource {

    private final UserService userService;
    private final UserRepository userRepository;

    public AccountUserResource(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<Void> registerAccount(@Valid @RequestBody RegisterVM registerVM) {
        if (userRepository.findOneByLogin(registerVM.getLogin().toLowerCase()).isPresent()) {
            throw new LoginAlreadyUsedException();
        }
        if (registerVM.getEmail() != null && userRepository.findOneByEmailIgnoreCase(registerVM.getEmail()).isPresent()) {
            throw new EmailAlreadyUsedException();
        }

        AdminUserDTO dto = new AdminUserDTO();
        dto.setLogin(registerVM.getLogin());
        dto.setFirstName(registerVM.getFirstName());
        dto.setLastName(registerVM.getLastName());
        dto.setEmail(registerVM.getEmail());
        dto.setLangKey("en");
        userService.registerPublicUser(dto, registerVM.getPassword());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/account/mobile-tabs")
    public ResponseEntity<MobileTabSettingsVM> getMobileTabs() {
        List<String> hiddenTabs = userService.getCurrentUserMobileHiddenTabs().orElse(List.of());
        MobileTabSettingsVM vm = new MobileTabSettingsVM();
        vm.setHiddenTabs(hiddenTabs);
        return ResponseEntity.ok(vm);
    }

    @PutMapping("/account/mobile-tabs")
    public ResponseEntity<MobileTabSettingsVM> updateMobileTabs(@Valid @RequestBody MobileTabSettingsVM vm) {
        List<String> hiddenTabs = vm.getHiddenTabs() == null ? List.of() : vm.getHiddenTabs();
        List<String> updated = userService.updateCurrentUserMobileHiddenTabs(hiddenTabs).orElse(List.of());
        MobileTabSettingsVM out = new MobileTabSettingsVM();
        out.setHiddenTabs(updated);
        return ResponseEntity.ok(out);
    }
}
