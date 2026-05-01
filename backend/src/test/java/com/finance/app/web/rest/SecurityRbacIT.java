package com.finance.app.web.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.finance.app.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@IntegrationTest
@AutoConfigureMockMvc
class SecurityRbacIT {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(authorities = { "ROLE_VIEWER" })
    void viewerCanReadItems() throws Exception {
        mockMvc.perform(get("/api/items")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = { "ROLE_VIEWER" })
    void viewerCannotCreateItems() throws Exception {
        mockMvc
            .perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = { "PERM_ITEMS_WRITE" })
    void customWritePermissionAllowsItemCreatePath() throws Exception {
        // Expected to fail validation/business rules, but must pass authorization layer.
        mockMvc
            .perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = { "ROLE_VIEWER" })
    void viewerCannotAccessAdminUsersApi() throws Exception {
        mockMvc.perform(get("/api/admin/users")).andExpect(status().isForbidden());
    }
}
