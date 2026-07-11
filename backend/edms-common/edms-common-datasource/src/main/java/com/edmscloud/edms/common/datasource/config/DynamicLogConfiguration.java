package com.edmscloud.edms.common.datasource.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;

/**
 * @author lengleng
 * @date 2022/8/8
 *
 * 注入SQL 格式化的插件
 */
@ConditionalOnClass(name = "com.edmscloud.edms.common.data.mybatis.DruidSqlLogFilter")
public class DynamicLogConfiguration {

}
