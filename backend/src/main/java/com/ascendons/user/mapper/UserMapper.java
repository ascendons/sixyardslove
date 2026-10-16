package com.ascendons.user.mapper;

import com.ascendons.user.dto.UserProfileResponse;
import com.ascendons.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "role", expression = "java(user.getRole().name())")
    UserProfileResponse toProfileResponse(User user);
}
